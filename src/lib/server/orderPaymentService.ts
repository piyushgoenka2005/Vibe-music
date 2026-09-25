import "server-only";

import { prisma } from "@/lib/db/prisma";
import { calculateGST, SELLER_STATE } from "@/lib/gstCalculator";
import { incrementCouponUsage } from "@/lib/server/couponService";
import { notifyAdminNewOrder, notifyOrderRefunded } from "@/lib/server/orderNotificationService";
import { dispatchLifecycleNotification } from "@/lib/server/notifications";
import {
  sendServerPurchaseEvent,
  sendServerRefundEvent,
} from "@/lib/analytics/measurementProtocol";
import {
  findOrderByRazorpayOrderId as findOrderByRazorpayOrderIdFromStore,
  findOrderByRazorpayPaymentId as findOrderByRazorpayPaymentIdFromStore,
  lockOrderInTx,
  updateOrderInTx,
} from "@/lib/server/orderRepository";
import {
  fulfillReservedStockForOrderInTx,
  notifyWaitlistForReleasedOrder,
  releaseOrderInventoryInTx,
  reserveAndFulfillStockForOrderInTx,
} from "@/lib/server/inventoryService";
import type { OrderInventoryLine, OrderInventoryStatus } from "@/types/inventory";
import { assertRazorpayAmountMatchesOrder } from "@/lib/server/paymentAmountVerification";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

function issueInvoiceForOrder(order: Order) {
  return calculateGST({
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      gstRate: item.gstRate,
    })),
    couponDiscount: order.couponDiscount,
    shippingCharge: order.shippingCharge,
    platformFee: order.platformFee,
    sellerState: SELLER_STATE,
    buyerState: order.shippingAddress.state,
  });
}

function toInventoryLines(order: {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    name: string;
  }>;
}): OrderInventoryLine[] {
  return order.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    name: item.name,
  }));
}

export async function findOrderByRazorpayOrderId(
  razorpayOrderId: string,
): Promise<{ id: string; data: Order } | null> {
  const order = await findOrderByRazorpayOrderIdFromStore(razorpayOrderId);
  if (!order) return null;
  return { id: order.id, data: order };
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string,
): Promise<{ id: string; data: Order } | null> {
  const order = await findOrderByRazorpayPaymentIdFromStore(razorpayPaymentId);
  if (!order) return null;
  return { id: order.id, data: order };
}

export interface PaymentCompletionResult {
  order: Order;
  skipped: boolean;
  reason?: string;
}

interface PaymentCompletionWithReleaseResult extends PaymentCompletionResult {
  releasedStatus?: OrderInventoryStatus;
}

/**
 * Marks an order as paid and fulfills its inventory atomically.
 *
 * The order row is locked (`FOR UPDATE`) for the entire transition so that a
 * concurrent `payment.failed` (previous attempt) or a duplicate `captured`
 * (webhook retry vs. client verify) cannot clobber the payment state or drift
 * inventory. A `captured` event may always promote a previously `failed`
 * attempt to `paid` (money was received); that path re-reserves and re-fulfills
 * stock that an earlier failure had released.
 */
export async function completeOrderPayment(input: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentAmountPaise?: number;
  source: "client_verify" | "webhook";
}): Promise<PaymentCompletionResult> {
  const result = await prisma.$transaction(async (tx) => {
    const order = await lockOrderInTx(tx, input.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (
      input.razorpayOrderId &&
      order.razorpayOrderId &&
      order.razorpayOrderId !== input.razorpayOrderId
    ) {
      throw new Error("Razorpay order mismatch");
    }

    if (input.paymentAmountPaise != null) {
      assertRazorpayAmountMatchesOrder(order, input.paymentAmountPaise);
    }

    if (order.paymentStatus === "paid") {
      if (!order.invoice?.invoiceNumber) {
        const timestamp = new Date().toISOString();
        const completedOrder = await updateOrderInTx(tx, order, {
          invoice: issueInvoiceForOrder(order),
          ...(input.razorpaySignature ? { razorpaySignature: input.razorpaySignature } : {}),
          updatedAt: timestamp,
        });
        return { order: completedOrder, skipped: false };
      }

      return { order, skipped: true, reason: "already_paid" };
    }

    const inventoryLines = toInventoryLines(order);
    const inventoryState = order.inventoryStatus ?? "none";
    let inventoryFulfilled = inventoryState === "fulfilled";

    if (inventoryState === "reserved") {
      await fulfillReservedStockForOrderInTx(tx, order.id, inventoryLines);
      inventoryFulfilled = true;
    } else if (inventoryState === "none" || inventoryState === "released") {
      // A previous attempt may have failed and released the reservation; the
      // captured money now entitles the order to fresh stock.
      await reserveAndFulfillStockForOrderInTx(tx, order.id, inventoryLines);
      inventoryFulfilled = true;
    } else if (inventoryState !== "fulfilled") {
      throw new Error(`Cannot fulfill inventory for order in state: ${inventoryState}`);
    }

    const timestamp = new Date().toISOString();
    const invoice =
      order.invoice?.invoiceNumber != null ? order.invoice : issueInvoiceForOrder(order);

    const updated: Partial<Order> = {
      paymentStatus: "paid" satisfies PaymentStatus,
      status: "confirmed" satisfies OrderStatus,
      razorpayPaymentId: input.razorpayPaymentId,
      inventoryStatus: inventoryFulfilled ? "fulfilled" : "none",
      paymentCompletedAt: timestamp,
      paymentSource: input.source,
      invoice,
      updatedAt: timestamp,
    };

    if (input.razorpayOrderId) {
      updated.razorpayOrderId = input.razorpayOrderId;
    }

    if (input.razorpaySignature) {
      updated.razorpaySignature = input.razorpaySignature;
    }

    const completedOrder = await updateOrderInTx(tx, order, updated);

    // We own the paid transition (row lock), so only this writer reaches here.
    if (completedOrder.couponCode && !completedOrder.couponUsageApplied) {
      await incrementCouponUsage(completedOrder.couponCode);
      await updateOrderInTx(tx, completedOrder, {
        couponUsageApplied: true,
        updatedAt: timestamp,
      });
    }

    return { order: completedOrder, skipped: false };
  });

  void notifyAdminNewOrder(result.order);
  void dispatchLifecycleNotification({
    event: "order_confirmed",
    recipient: {
      email: result.order.email,
      phone: result.order.shippingAddress?.phone ?? null,
      userId: result.order.userId ?? null,
      customerName: result.order.customerName ?? null,
    },
    context: {
      orderId: result.order.id,
      total: result.order.total,
      itemLines: result.order.items.map((item) => `${item.quantity} × ${item.name}`),
    },
  }).catch(() => undefined);
  void sendServerPurchaseEvent(result.order);

  return result;
}

/**
 * Marks an order payment as failed, cancelling it and releasing its inventory
 * atomically under the order-row lock. A concurrent `payment.captured` that wins
 * the lock first is never overwritten (returns `already_paid`).
 */
export async function failOrderPayment(input: {
  orderId: string;
  razorpayPaymentId?: string;
  reason?: string;
}): Promise<PaymentCompletionResult> {
  const result = await prisma.$transaction<PaymentCompletionWithReleaseResult>(async (tx) => {
    const order = await lockOrderInTx(tx, input.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      return { order, skipped: true, reason: "already_paid" };
    }

    if (order.paymentStatus === "failed") {
      return { order, skipped: true, reason: "already_failed" };
    }

    const releasedStatus = order.inventoryStatus ?? "none";
    await releaseOrderInventoryInTx(tx, order);

    const timestamp = new Date().toISOString();

    const updated: Partial<Order> = {
      paymentStatus: "failed",
      status: "cancelled",
      inventoryStatus: "released",
      paymentFailureReason: input.reason ?? null,
      updatedAt: timestamp,
    };

    if (input.razorpayPaymentId) {
      updated.razorpayPaymentId = input.razorpayPaymentId;
    }

    const failedOrder = await updateOrderInTx(tx, order, updated);

    return {
      order: failedOrder,
      skipped: false,
      releasedStatus,
    };
  });

  // A released reservation frees stock; notify anyone on the waitlist.
  if (result.releasedStatus === "reserved" || result.releasedStatus === "fulfilled") {
    void notifyWaitlistForReleasedOrder({
      ...result.order,
      inventoryStatus: result.releasedStatus,
    }).catch(() => undefined);
  }

  return result;
}

export async function refundOrderPayment(input: {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
}): Promise<PaymentCompletionResult> {
  const result = await prisma.$transaction<PaymentCompletionWithReleaseResult>(async (tx) => {
    const order = await lockOrderInTx(tx, input.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "refunded") {
      return { order, skipped: true, reason: "already_refunded" };
    }

    const releasedStatus = order.inventoryStatus ?? "none";
    await releaseOrderInventoryInTx(tx, order);

    const timestamp = new Date().toISOString();

    const updated: Partial<Order> = {
      paymentStatus: "refunded",
      status: "refunded",
      inventoryStatus: "released",
      razorpayRefundId: input.razorpayRefundId ?? null,
      refundedAt: timestamp,
      updatedAt: timestamp,
    };

    if (input.razorpayPaymentId) {
      updated.razorpayPaymentId = input.razorpayPaymentId;
    }

    const refundedOrder = await updateOrderInTx(tx, order, updated);

    return {
      order: refundedOrder,
      skipped: false,
      releasedStatus,
    };
  });

  if (result.releasedStatus === "reserved" || result.releasedStatus === "fulfilled") {
    void notifyWaitlistForReleasedOrder({
      ...result.order,
      inventoryStatus: result.releasedStatus,
    }).catch(() => undefined);
  }
  void notifyOrderRefunded(result.order);
  void sendServerRefundEvent(result.order);

  return result;
}

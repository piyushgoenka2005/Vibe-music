import "server-only";

import { incrementCouponUsage } from "@/lib/server/couponService";
import { sendOrderConfirmationEmail } from "@/lib/server/orderEmailService";
import {
  isFirestoreUnavailableError,
  logFirestoreWarning,
} from "@/lib/server/firestoreErrors";
import {
  fetchOrderById,
  findOrderByRazorpayOrderId as findOrderByRazorpayOrderIdFromStore,
  findOrderByRazorpayPaymentId as findOrderByRazorpayPaymentIdFromStore,
  updateOrder,
} from "@/lib/server/orderRepository";
import {
  fulfillReservedStockForOrder,
  releaseOrderInventory,
} from "@/lib/server/inventoryService";
import type { OrderInventoryLine } from "@/types/inventory";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

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
  razorpayOrderId: string
): Promise<{ id: string; data: Order } | null> {
  const order = await findOrderByRazorpayOrderIdFromStore(razorpayOrderId);
  if (!order) return null;
  return { id: order.id, data: order };
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string
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

export async function completeOrderPayment(input: {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  source: "client_verify" | "webhook";
}): Promise<PaymentCompletionResult> {
  const order = await fetchOrderById(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (input.razorpayOrderId && order.razorpayOrderId !== input.razorpayOrderId) {
    throw new Error("Razorpay order mismatch");
  }

  if (order.paymentStatus === "paid") {
    return { order, skipped: true, reason: "already_paid" };
  }

  const inventoryLines = toInventoryLines(order);

  const inventoryState = order.inventoryStatus ?? "none";

  if (inventoryState === "reserved") {
    try {
      await fulfillReservedStockForOrder(order.id, inventoryLines);
    } catch (error) {
      if (!isFirestoreUnavailableError(error)) {
        throw error;
      }
      logFirestoreWarning(
        "inventory",
        error,
        "Skipping inventory fulfillment — Firestore unavailable"
      );
    }
  } else if (inventoryState !== "fulfilled" && inventoryState !== "none") {
    throw new Error(
      `Cannot fulfill inventory for order in state: ${inventoryState}`
    );
  }

  await applyCouponUsageIfNeeded(order);

  const timestamp = new Date().toISOString();

  const updated: Partial<Order> = {
    paymentStatus: "paid" satisfies PaymentStatus,
    status: "confirmed" satisfies OrderStatus,
    razorpayPaymentId: input.razorpayPaymentId,
    inventoryStatus: "fulfilled",
    paymentCompletedAt: timestamp,
    paymentSource: input.source,
    updatedAt: timestamp,
  };

  if (input.razorpayOrderId) {
    updated.razorpayOrderId = input.razorpayOrderId;
  }

  const completedOrder = await updateOrder(order.id, updated);
  void sendOrderConfirmationEmail(completedOrder);

  return {
    order: completedOrder,
    skipped: false,
  };
}

export async function failOrderPayment(input: {
  orderId: string;
  razorpayPaymentId?: string;
  reason?: string;
}): Promise<PaymentCompletionResult> {
  const order = await fetchOrderById(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "paid") {
    return { order, skipped: true, reason: "already_paid" };
  }

  if (order.paymentStatus === "failed") {
    return { order, skipped: true, reason: "already_failed" };
  }

  await releaseOrderInventory(order);

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

  const failedOrder = await updateOrder(order.id, updated);

  return {
    order: failedOrder,
    skipped: false,
  };
}

export async function refundOrderPayment(input: {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
}): Promise<PaymentCompletionResult> {
  const order = await fetchOrderById(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "refunded") {
    return { order, skipped: true, reason: "already_refunded" };
  }

  await releaseOrderInventory(order);

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

  const refundedOrder = await updateOrder(order.id, updated);

  return {
    order: refundedOrder,
    skipped: false,
  };
}

async function applyCouponUsageIfNeeded(order: Order): Promise<void> {
  if (!order.couponCode || order.couponUsageApplied) {
    return;
  }

  const fresh = await fetchOrderById(order.id);
  if (!fresh || fresh.couponUsageApplied) {
    return;
  }

  try {
    await incrementCouponUsage(order.couponCode);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logFirestoreWarning(
        "coupons",
        error,
        "Skipping coupon usage increment — Firestore unavailable"
      );
    } else {
      throw error;
    }
  }

  await updateOrder(order.id, {
    couponUsageApplied: true,
    updatedAt: new Date().toISOString(),
  });
}

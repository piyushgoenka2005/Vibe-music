import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { incrementCouponUsage } from "@/lib/server/couponService";
import { sendOrderConfirmationEmail } from "@/lib/server/orderEmailService";
import {
  fulfillReservedStockForOrder,
  releaseOrderInventory,
} from "@/lib/server/inventoryService";
import type { OrderInventoryLine } from "@/types/inventory";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

async function getOrderById(orderId: string): Promise<Order | null> {
  const doc = await getAdminFirestore().collection("orders").doc(orderId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Order;
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
  razorpayOrderId: string
): Promise<{ id: string; data: Order } | null> {
  const snap = await getAdminFirestore()
    .collection("orders")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, data: { id: doc.id, ...doc.data() } as Order };
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string
): Promise<{ id: string; data: Order } | null> {
  const snap = await getAdminFirestore()
    .collection("orders")
    .where("razorpayPaymentId", "==", razorpayPaymentId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, data: { id: doc.id, ...doc.data() } as Order };
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
  const order = await getOrderById(input.orderId);
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

  if (order.inventoryStatus === "reserved") {
    await fulfillReservedStockForOrder(order.id, inventoryLines);
  } else if (order.inventoryStatus !== "fulfilled") {
    throw new Error(
      `Cannot fulfill inventory for order in state: ${order.inventoryStatus ?? "none"}`
    );
  }

  await applyCouponUsageIfNeeded(order);

  const timestamp = new Date().toISOString();
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(order.id);

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

  await orderRef.update(updated);

  const completedOrder = { ...order, ...updated };
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
  const order = await getOrderById(input.orderId);
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
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(order.id);

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

  await orderRef.update(updated);

  return {
    order: { ...order, ...updated },
    skipped: false,
  };
}

export async function refundOrderPayment(input: {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
}): Promise<PaymentCompletionResult> {
  const order = await getOrderById(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "refunded") {
    return { order, skipped: true, reason: "already_refunded" };
  }

  await releaseOrderInventory(order);

  const timestamp = new Date().toISOString();
  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(order.id);

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

  await orderRef.update(updated);

  return {
    order: { ...order, ...updated },
    skipped: false,
  };
}

async function applyCouponUsageIfNeeded(order: Order): Promise<void> {
  if (!order.couponCode || order.couponUsageApplied) {
    return;
  }

  const db = getAdminFirestore();
  const orderRef = db.collection("orders").doc(order.id);
  const fresh = await orderRef.get();
  const data = fresh.data() as Order | undefined;

  if (!data || data.couponUsageApplied) {
    return;
  }

  await incrementCouponUsage(order.couponCode);
  await orderRef.update({
    couponUsageApplied: true,
    updatedAt: new Date().toISOString(),
  });
}

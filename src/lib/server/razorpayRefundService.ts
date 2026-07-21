import "server-only";

import Razorpay from "razorpay";
import { refundOrderPayment } from "@/lib/server/orderPaymentService";
import { fetchOrderById } from "@/lib/server/orderRepository";
import { logAuditEvent } from "@/lib/server/auditLog";

function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay env vars");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function initiateOrderRefund(input: {
  orderId: string;
  amountPaise?: number;
  actorEmail: string;
  note?: string;
  request?: Request;
}): Promise<{ orderId: string; razorpayRefundId?: string; skipped?: boolean }> {
  const order = await fetchOrderById(input.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "refunded") {
    return { orderId: order.id, skipped: true };
  }

  if (!order.razorpayPaymentId) {
    throw new Error("No Razorpay payment on this order");
  }

  const razorpay = getRazorpayInstance();
  const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
    amount: input.amountPaise,
    notes: {
      orderId: order.id,
      initiatedBy: input.actorEmail,
      ...(input.note?.trim() ? { note: input.note.trim().slice(0, 200) } : {}),
    },
  });

  const result = await refundOrderPayment({
    orderId: order.id,
    razorpayPaymentId: order.razorpayPaymentId,
    razorpayRefundId: refund.id,
  });

  await logAuditEvent({
    action: "order.refund_initiated",
    actorEmail: input.actorEmail,
    resourceType: "order",
    resourceId: order.id,
    request: input.request,
    metadata: {
      razorpayRefundId: refund.id,
      amountPaise: input.amountPaise ?? null,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    },
  });

  return {
    orderId: result.order.id,
    razorpayRefundId: refund.id,
  };
}

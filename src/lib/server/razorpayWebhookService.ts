import "server-only";

import {
  completeOrderPayment,
  failOrderPayment,
  findOrderByRazorpayOrderId,
  findOrderByRazorpayPaymentId,
  refundOrderPayment,
} from "@/lib/server/orderPaymentService";
import {
  createOrGetPaymentLog,
  updatePaymentLogStatus,
} from "@/lib/server/paymentLogRepository";
import type { RazorpayWebhookEventType } from "@/types/payment";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  notes?: Record<string, string>;
  error_description?: string;
  error_reason?: string;
}

interface RazorpayRefundEntity {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
}

export interface WebhookProcessResult {
  eventId: string;
  eventType: string;
  orderId?: string | null;
  skipped: boolean;
  message: string;
}

const HANDLED_EVENTS: RazorpayWebhookEventType[] = [
  "payment.captured",
  "payment.failed",
  "refund.processed",
];

function extractPaymentEntity(
  payload: Record<string, unknown>
): RazorpayPaymentEntity | null {
  const payment = payload.payment as { entity?: RazorpayPaymentEntity } | undefined;
  return payment?.entity ?? null;
}

function extractRefundEntity(
  payload: Record<string, unknown>
): RazorpayRefundEntity | null {
  const refund = payload.refund as { entity?: RazorpayRefundEntity } | undefined;
  return refund?.entity ?? null;
}

async function resolveOrderIdFromPayment(
  payment: RazorpayPaymentEntity
): Promise<string | null> {
  const notesOrderId = payment.notes?.orderId;
  if (notesOrderId) return notesOrderId;

  const match = await findOrderByRazorpayOrderId(payment.order_id);
  return match?.id ?? null;
}

async function resolveOrderIdFromRefund(
  refund: RazorpayRefundEntity
): Promise<string | null> {
  const match = await findOrderByRazorpayPaymentId(refund.payment_id);
  return match?.id ?? null;
}

export async function processRazorpayWebhook(input: {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<WebhookProcessResult> {
  const payment = extractPaymentEntity(input.payload);
  const refund = extractRefundEntity(input.payload);

  const { log, isNew } = await createOrGetPaymentLog({
    razorpayEventId: input.eventId,
    eventType: input.eventType,
    payload: input.payload,
    orderId: null,
    razorpayOrderId: payment?.order_id ?? null,
    razorpayPaymentId: payment?.id ?? refund?.payment_id ?? null,
    razorpayRefundId: refund?.id ?? null,
  });

  if (!isNew && (log.status === "processed" || log.status === "skipped")) {
    return {
      eventId: input.eventId,
      eventType: input.eventType,
      orderId: log.orderId,
      skipped: true,
      message: `Event already ${log.status}`,
    };
  }

  if (!HANDLED_EVENTS.includes(input.eventType)) {
    await updatePaymentLogStatus(input.eventId, {
      status: "skipped",
      error: `Unhandled event type: ${input.eventType}`,
      processedAt: new Date().toISOString(),
      attemptCount: log.attemptCount + 1,
    });

    return {
      eventId: input.eventId,
      eventType: input.eventType,
      skipped: true,
      message: "Unhandled event type",
    };
  }

  await updatePaymentLogStatus(input.eventId, {
    status: "processing",
    attemptCount: log.attemptCount + 1,
  });

  try {
    let orderId: string | null = null;
    let message = "Processed";

    switch (input.eventType) {
      case "payment.captured": {
        if (!payment) throw new Error("Missing payment entity in payload");
        orderId = await resolveOrderIdFromPayment(payment);
        if (!orderId) throw new Error("Order not found for payment.captured");

        const result = await completeOrderPayment({
          orderId,
          razorpayPaymentId: payment.id,
          razorpayOrderId: payment.order_id,
          source: "webhook",
        });

        message = result.skipped
          ? `Payment already completed (${result.reason})`
          : "Payment captured and order confirmed";
        break;
      }

      case "payment.failed": {
        if (!payment) throw new Error("Missing payment entity in payload");
        orderId = await resolveOrderIdFromPayment(payment);
        if (!orderId) throw new Error("Order not found for payment.failed");

        const failureReason =
          payment.error_description ??
          payment.error_reason ??
          `Payment failed (${payment.status})`;

        const result = await failOrderPayment({
          orderId,
          razorpayPaymentId: payment.id,
          reason: failureReason,
        });

        message = result.skipped
          ? `Failure already recorded (${result.reason})`
          : "Payment failed and order cancelled";
        break;
      }

      case "refund.processed": {
        if (!refund) throw new Error("Missing refund entity in payload");
        orderId = await resolveOrderIdFromRefund(refund);
        if (!orderId) throw new Error("Order not found for refund.processed");

        const result = await refundOrderPayment({
          orderId,
          razorpayPaymentId: refund.payment_id,
          razorpayRefundId: refund.id,
        });

        message = result.skipped
          ? `Refund already recorded (${result.reason})`
          : "Refund processed and inventory restored";
        break;
      }

      default:
        throw new Error(`Unsupported event: ${input.eventType}`);
    }

    await updatePaymentLogStatus(input.eventId, {
      status: "processed",
      orderId,
      razorpayOrderId: payment?.order_id ?? log.razorpayOrderId ?? null,
      razorpayPaymentId: payment?.id ?? refund?.payment_id ?? log.razorpayPaymentId ?? null,
      razorpayRefundId: refund?.id ?? log.razorpayRefundId ?? null,
      error: null,
      processedAt: new Date().toISOString(),
    });

    return {
      eventId: input.eventId,
      eventType: input.eventType,
      orderId,
      skipped: false,
      message,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Webhook processing failed";

    await updatePaymentLogStatus(input.eventId, {
      status: "failed",
      error: errorMessage,
    });

    throw error;
  }
}

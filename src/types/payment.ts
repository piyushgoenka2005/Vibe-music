export type PaymentLogStatus =
  | "received"
  | "processing"
  | "processed"
  | "failed"
  | "skipped";

export type RazorpayWebhookEventType =
  | "payment.captured"
  | "payment.failed"
  | "refund.processed"
  | string;

export interface PaymentLog {
  id: string;
  razorpayEventId: string;
  eventType: RazorpayWebhookEventType;
  status: PaymentLogStatus;
  orderId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayRefundId?: string | null;
  payload: Record<string, unknown>;
  error?: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
}

export interface PaymentWebhookMetrics {
  totalEvents: number;
  processed: number;
  failed: number;
  skipped: number;
  received: number;
  processing: number;
  byEventType: Record<string, number>;
  last24Hours: {
    total: number;
    processed: number;
    failed: number;
  };
  recentFailures: Array<{
    id: string;
    eventType: string;
    orderId?: string | null;
    error?: string | null;
    createdAt: string;
  }>;
}

export interface RazorpayWebhookHeaders {
  signature: string | null;
  eventId: string | null;
}

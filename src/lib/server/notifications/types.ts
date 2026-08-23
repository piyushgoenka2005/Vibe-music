import "server-only";

/**
 * Channel-agnostic transactional notification contract (master program Phase 8).
 * Business logic calls dispatchLifecycleNotification() and must never import a
 * specific provider. Providers degrade gracefully when unconfigured.
 */

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

/** Order/rental lifecycle events that trigger transactional messages. */
export type LifecycleEvent =
  | "order_confirmed"
  | "payment_failed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "order_cancelled"
  | "refund_initiated"
  | "rental_booked"
  | "rental_reminder";

export interface LifecycleRecipient {
  /** Customer email — used by the email channel and as an idempotency key. */
  email: string;
  /** E.164 digits for SMS/WhatsApp (e.g. 919773651006). Optional. */
  phone?: string | null;
  /** Logged-in user id — enables preference gating + web push. Optional. */
  userId?: string | null;
  customerName?: string | null;
}

export interface OrderContext {
  orderId: string;
  orderUrl?: string;
  trackingToken?: string | null;
  courier?: string | null;
  trackingNumber?: string | null;
  total?: number;
  refundId?: string | null;
  /** Short human-readable item lines for the confirmation email body. */
  itemLines?: string[];
}

export interface RenderedMessage {
  subject: string;
  html: string;
  text: string;
  smsText: string;
  pushTitle: string;
  pushBody: string;
  url: string;
}

export interface SendResult {
  channel: NotificationChannel;
  ok: boolean;
  /** Provider detail for logs — never include secrets or full PII. */
  detail?: string;
  skipped?: boolean;
  retryable?: boolean;
}

export interface ChannelProvider {
  readonly channel: NotificationChannel;
  /** Report whether credentials are present so dispatch can skip cleanly. */
  isConfigured(): boolean;
  send(input: {
    to: string;
    message: RenderedMessage;
    event: LifecycleEvent;
  }): Promise<SendResult>;
}

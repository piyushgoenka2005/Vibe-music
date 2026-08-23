import "server-only";

import { logAuditEvent } from "@/lib/server/auditLog";
import {
  getNotificationPreferences,
  notifyUserIfAllowed,
} from "@/lib/server/notificationRepository";
import { isPushConfigured, sendPushToUser } from "@/lib/server/pushService";
import type { NotificationType } from "@/types/notification";
import { emailProvider } from "./providers/email";
import { smsProvider } from "./providers/sms";
import { whatsappProvider } from "./providers/whatsapp";
import { renderLifecycleMessage } from "./templates";
import type {
  ChannelProvider,
  LifecycleEvent,
  LifecycleRecipient,
  OrderContext,
} from "./types";

const PROVIDERS: ChannelProvider[] = [emailProvider, smsProvider, whatsappProvider];

/** Events that belong to the customer's "order updates" preference bucket. */
const ORDER_UPDATE_EVENTS = new Set<LifecycleEvent>([
  "order_confirmed",
  "payment_failed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "order_cancelled",
  "refund_initiated",
  "rental_booked",
  "rental_reminder",
]);

async function sendWithRetry(
  provider: ChannelProvider,
  input: Parameters<ChannelProvider["send"]>[0],
  maxAttempts = 2
): Promise<Awaited<ReturnType<ChannelProvider["send"]>>> {
  let last: Awaited<ReturnType<ChannelProvider["send"]>> | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await provider.send(input);
    if (result.ok || result.skipped || !result.retryable) return result;
    last = result;
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  return last!;
}

export interface DispatchResult {
  event: LifecycleEvent;
  attempted: string[];
  ok: string[];
  skipped: string[];
  failed: string[];
}

/**
 * Fire a lifecycle notification across all applicable channels.
 *
 * Guarantees:
 * - NEVER throws (commerce flow must not break because comms hiccups)
 * - Respects the recipient's in-app notification preferences when userId given
 * - Skips unconfigured channels silently (detail recorded for ops)
 * - In-app bell entry is always created for logged-in users
 */
export async function dispatchLifecycleNotification(input: {
  event: LifecycleEvent;
  recipient: LifecycleRecipient;
  context: OrderContext;
}): Promise<DispatchResult> {
  const result: DispatchResult = {
    event: input.event,
    attempted: [],
    ok: [],
    skipped: [],
    failed: [],
  };

  try {
    const message = renderLifecycleMessage(input.event, input.recipient, input.context);

    // In-app bell entry for logged-in users (respects their preferences).
    if (input.recipient.userId) {
      void notifyUserIfAllowed({
        userId: input.recipient.userId,
        type: "order_update" satisfies NotificationType,
        title: message.pushTitle,
        body: message.pushBody,
        link: `/account/orders/${input.context.orderId}`,
      }).catch(() => undefined);
    }

    // Web push (4th channel) — respects prefs, inert without VAPID keys.
    if (
      isPushConfigured() &&
      input.recipient.userId &&
      ORDER_UPDATE_EVENTS.has(input.event)
    ) {
      let pushAllowed = true;
      try {
        const prefs = await getNotificationPreferences(input.recipient.userId);
        pushAllowed = prefs.orderUpdates;
      } catch {
        pushAllowed = true;
      }
      if (pushAllowed) {
        void sendPushToUser(input.recipient.userId, {
          title: message.pushTitle,
          body: message.pushBody,
          url: `/account/orders/${input.context.orderId}`,
          tag: `order:${input.context.orderId}`,
        }).catch(() => undefined);
      }
    }

    // Preference gate: guests have no stored prefs → treat as opted-in for
    // transactional order messages (they are fulfillment-critical, not marketing).
    let allowed = true;
    if (input.recipient.userId) {
      try {
        const prefs = await getNotificationPreferences(input.recipient.userId);
        allowed =
          prefs.orderUpdates ||
          !ORDER_UPDATE_EVENTS.has(input.event); // non-order events unaffected here
      } catch {
        allowed = true; // fail open for transactional messages
      }
    }
    if (!allowed) {
      result.skipped.push("email", "sms", "whatsapp");
      return result;
    }

    await Promise.all(
      PROVIDERS.map(async (provider) => {
        const to =
          provider.channel === "email"
            ? input.recipient.email
            : input.recipient.phone ?? "";

        if (!to) {
          result.skipped.push(provider.channel);
          return;
        }
        if (!provider.isConfigured()) {
          result.skipped.push(provider.channel);
          return;
        }

        result.attempted.push(provider.channel);
        const sendResult = await sendWithRetry(provider, {
          to,
          message,
          event: input.event,
        });
        if (sendResult.ok) result.ok.push(provider.channel);
        else if (sendResult.skipped) result.skipped.push(provider.channel);
        else result.failed.push(provider.channel);

        if (!sendResult.ok && !sendResult.skipped) {
          void logAuditEvent({
            action: `notification.${input.event}.failed`,
            actorEmail: input.recipient.email,
            resourceType: "notification",
            resourceId: `${input.event}:${input.context.orderId}`,
            metadata: { channel: sendResult.channel, detail: sendResult.detail },
          }).catch(() => undefined);
        }
      })
    );
  } catch (error) {
    // Absolutely never propagate to commerce callers.
    console.error("[notifications] dispatch error", input.event, error);
  }

  return result;
}

export function getChannelStatus() {
  return PROVIDERS.map((p) => ({
    channel: p.channel,
    configured: p.isConfigured(),
  }));
}

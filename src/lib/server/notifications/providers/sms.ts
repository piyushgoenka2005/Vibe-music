import "server-only";

import type {
  ChannelProvider,
  LifecycleEvent,
  RenderedMessage,
  SendResult,
} from "../types";

/**
 * MSG91 transactional SMS adapter (India/DLT route).
 *
 * Activation (all required, none present → channel skips silently):
 *   SMS_PROVIDER=msg91
 *   MSG91_AUTH_KEY=<authkey>
 *   MSG91_SENDER_ID=<6-char DLT sender>
 *   MSG91_TEMPLATE_ORDER=<DLT template id with #VAR# variables>
 *
 * DLT rules mean templates are registered per-message — we map the lifecycle
 * event to its approved template id and send variables in MSG91's expected
 * `#VAR1#` body format.
 */
const AUTH_KEY = process.env.MSG91_AUTH_KEY?.trim() ?? "";
const SENDER_ID = process.env.MSG91_SENDER_ID?.trim() ?? "";
const TEMPLATE_IDS: Partial<Record<LifecycleEvent, string>> = {
  order_confirmed: process.env.MSG91_TEMPLATE_ORDER?.trim() ?? "",
  shipped: process.env.MSG91_TEMPLATE_SHIPPED?.trim() ?? "",
  out_for_delivery: process.env.MSG91_TEMPLATE_OUT_FOR_DELIVERY?.trim() ?? "",
  delivered: process.env.MSG91_TEMPLATE_DELIVERED?.trim() ?? "",
  order_cancelled: process.env.MSG91_TEMPLATE_CANCELLED?.trim() ?? "",
  refund_initiated: process.env.MSG91_TEMPLATE_REFUND?.trim() ?? "",
};

export const smsProvider: ChannelProvider = {
  channel: "sms",
  isConfigured() {
    return (
      (process.env.SMS_PROVIDER ?? "").toLowerCase() === "msg91" &&
      AUTH_KEY.length > 0 &&
      SENDER_ID.length > 0
    );
  },
  async send(input: {
    to: string;
    message: RenderedMessage;
    event: LifecycleEvent;
  }): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { channel: "sms", ok: false, skipped: true };
    }

    const templateId = TEMPLATE_IDS[input.event] ?? "";
    if (!templateId) {
      return {
        channel: "sms",
        ok: false,
        skipped: true,
        detail: `no DLT template registered for ${input.event}`,
      };
    }

    // Normalize to digits-only E.164 without '+' for MSG91.
    const mobile = input.to.replace(/\D/g, "");

    try {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          accept: "application/json",
          authkey: AUTH_KEY,
          "content-type": "application/json",
        },
        signal: AbortSignal.timeout(8_000),
        body: JSON.stringify({
          template_id: templateId,
          short_url: "0",
          // DLT templates carry one variable slot per approved message.
          recipients: [{ mobiles: mobile, VAR1: input.message.smsText }],
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
      if (!res.ok || body.type === "error") {
        return {
          channel: "sms",
          ok: false,
          retryable: res.status >= 500,
          detail: body.message ?? `HTTP ${res.status}`,
        };
      }
      return { channel: "sms", ok: true };
    } catch (error) {
      return {
        channel: "sms",
        ok: false,
        retryable: true,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

import "server-only";

import type {
  ChannelProvider,
  LifecycleEvent,
  RenderedMessage,
  SendResult,
} from "../types";

/**
 * WhatsApp Cloud API (Meta) adapter.
 *
 * Activation (all required, none present → channel skips silently):
 *   WHATSAPP_TOKEN=<permanent system-user token>
 *   WHATSAPP_PHONE_NUMBER_ID=<phone number id>
 *
 * Transactional order updates on WhatsApp in India require an approved
 * template; the event maps to a template name with the tracking/order link
 * passed as a body variable. Until templates are approved, sends skip with a
 * detail note instead of erroring — checkout is never blocked by comms.
 */
const TOKEN = process.env.WHATSAPP_TOKEN?.trim() ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";

const TEMPLATE_NAMES: Partial<Record<LifecycleEvent, string>> = {
  order_confirmed: process.env.WHATSAPP_TEMPLATE_ORDER?.trim() ?? "order_confirmed",
  shipped: process.env.WHATSAPP_TEMPLATE_SHIPPED?.trim() ?? "order_shipped",
  out_for_delivery: "order_out_for_delivery",
  delivered: "order_delivered",
  order_cancelled: "order_cancelled",
  refund_initiated: "order_refund",
};

export const whatsappProvider: ChannelProvider = {
  channel: "whatsapp",
  isConfigured() {
    return TOKEN.length > 0 && PHONE_ID.length > 0;
  },
  async send(input: {
    to: string;
    message: RenderedMessage;
    event: LifecycleEvent;
  }): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { channel: "whatsapp", ok: false, skipped: true };
    }

    const template = TEMPLATE_NAMES[input.event];
    if (!template) {
      return {
        channel: "whatsapp",
        ok: false,
        skipped: true,
        detail: `no template mapped for ${input.event}`,
      };
    }

    const mobile = input.to.replace(/\D/g, "");

    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${TOKEN}`,
            "content-type": "application/json",
          },
          signal: AbortSignal.timeout(8_000),
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mobile,
            type: "template",
            template: {
              name: template,
              language: { code: "en" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: input.message.pushBody || message_text(input.message) },
                    { type: "text", text: input.message.url },
                  ],
                },
              ],
            },
          }),
        }
      );
      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        return {
          channel: "whatsapp",
          ok: false,
          retryable: res.status >= 500,
          detail: body.error?.message ?? `HTTP ${res.status}`,
        };
      }
      return { channel: "whatsapp", ok: true };
    } catch (error) {
      return {
        channel: "whatsapp",
        ok: false,
        retryable: true,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

function message_text(message: RenderedMessage): string {
  return message.text.split("\n")[0] ?? "";
}

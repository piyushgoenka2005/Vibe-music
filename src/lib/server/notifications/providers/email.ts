import "server-only";

import { sendMail } from "@/lib/server/email";
import { mailboxAddress } from "@/lib/server/email/mailboxes";
import { isSmtpConfigured } from "@/lib/server/email";
import type {
  ChannelProvider,
  LifecycleEvent,
  RenderedMessage,
  SendResult,
} from "../types";

/** Transactional email — live today via SMTP; skips cleanly when unset. */
export const emailProvider: ChannelProvider = {
  channel: "email",
  isConfigured() {
    return isSmtpConfigured();
  },
  async send(input: {
    to: string;
    message: RenderedMessage;
    event: LifecycleEvent;
  }): Promise<SendResult> {
    try {
      await sendMail({
        to: input.to,
        from: mailboxAddress("orders"),
        subject: input.message.subject,
        html: input.message.html,
        text: input.message.text,
      });
      return { channel: "email", ok: true };
    } catch (error) {
      return {
        channel: "email",
        ok: false,
        retryable: true,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

import "server-only";

import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { isSmtpConfigured, resolveSmtpConfig } from "@/lib/server/email/smtpConfig";

export { isSmtpConfigured, resolveSmtpConfig };

type SmtpTransport = ReturnType<typeof nodemailer.createTransport>;

export interface SendMailInput {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendMailResult {
  ok: boolean;
  messageId?: string;
  skipped?: boolean;
}

let cachedTransport: SmtpTransport | null | undefined;

export function getSmtpTransport(): SmtpTransport | null {
  if (cachedTransport !== undefined) {
    return cachedTransport;
  }

  const config = resolveSmtpConfig();
  if (!config?.host || !config.pass) {
    cachedTransport = null;
    return null;
  }

  // Only Resend's relay authenticates as the literal user "resend". A missing
  // SMTP_USER against a self-hosted server must fail loudly instead of
  // attempting to authenticate as "resend" (which always 535s and silently
  // breaks transactional email like password resets).
  const auth =
    config.source === "resend"
      ? { user: "resend", pass: config.pass }
      : config.user
        ? { user: config.user, pass: config.pass }
        : null;

  if (!auth) {
    console.error(
      `[smtp] SMTP_USER is not configured for host "${config.host}" — refusing to authenticate as a fallback user. Set SMTP_USER (e.g. support@vibemusic.in) or use RESEND_API_KEY.`,
    );
    cachedTransport = null;
    return null;
  }

  cachedTransport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    tls:
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  return cachedTransport;
}

/** Reset cached transport (useful in tests or after env changes). */
export function resetSmtpTransportCache(): void {
  cachedTransport = undefined;
}

function normalizeRecipients(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const transport = getSmtpTransport();
  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[smtp] Email not configured — not sent: "${input.subject}" → ${normalizeRecipients(input.to)}`,
      );
    } else {
      console.info(
        `[smtp] Skipped (SMTP/Resend not configured): "${input.subject}" → ${normalizeRecipients(input.to)}`,
      );
    }
    return { ok: false, skipped: true };
  }

  const message: Mail.Options = {
    from: input.from,
    to: input.to,
    replyTo: input.replyTo,
    cc: input.cc,
    bcc: input.bcc,
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  try {
    const info = await transport.sendMail(message);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error("[smtp] Send failed:", error);
    return { ok: false };
  }
}

export async function verifySmtpConnection(): Promise<boolean> {
  const transport = getSmtpTransport();
  if (!transport) return false;

  try {
    await transport.verify();
    return true;
  } catch (error) {
    console.error("[smtp] Connection verify failed:", error);
    return false;
  }
}

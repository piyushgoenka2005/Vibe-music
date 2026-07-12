import "server-only";

import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { isSmtpConfigured } from "@/lib/server/email/smtpConfig";

export { isSmtpConfigured };

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

function parseSmtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim();
  if (!raw) return 587;
  const port = Number(raw);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function isSecureSmtp(): boolean {
  if (process.env.SMTP_SECURE === "true") return true;
  if (process.env.SMTP_SECURE === "false") return false;
  return parseSmtpPort() === 465;
}

export function getSmtpTransport(): SmtpTransport | null {
  if (cachedTransport !== undefined) {
    return cachedTransport;
  }

  if (!isSmtpConfigured()) {
    cachedTransport = null;
    return null;
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    cachedTransport = null;
    return null;
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  cachedTransport = nodemailer.createTransport({
    host,
    port: parseSmtpPort(),
    secure: isSecureSmtp(),
    auth: user && pass ? { user, pass } : undefined,
    tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false"
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
        `[smtp] SMTP_HOST missing — email not sent: "${input.subject}" → ${normalizeRecipients(input.to)}`
      );
    } else {
      console.info(
        `[smtp] Skipped (SMTP not configured): "${input.subject}" → ${normalizeRecipients(input.to)}`
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

import "server-only";

/**
 * SMTP availability from env only — does not import nodemailer.
 * Safe for instrumentation and integration checks at startup.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

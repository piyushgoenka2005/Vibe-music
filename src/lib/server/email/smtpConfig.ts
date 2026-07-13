import "server-only";

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  source: "smtp" | "resend";
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const port = Number(raw);
  return Number.isFinite(port) && port > 0 ? port : fallback;
}

/**
 * Prefer explicit SMTP_* credentials. If SMTP_PASS is missing but RESEND_API_KEY
 * is set, use Resend's SMTP relay so transactional email still works.
 */
export function resolveSmtpConfig(): ResolvedSmtpConfig | null {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (host && pass) {
    const port = parsePort(process.env.SMTP_PORT, 587);
    const secure =
      process.env.SMTP_SECURE === "true"
        ? true
        : process.env.SMTP_SECURE === "false"
          ? false
          : port === 465;
    return {
      host,
      port,
      secure,
      user: user || undefined,
      pass,
      source: "smtp",
    };
  }

  if (resendKey) {
    return {
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      user: "resend",
      pass: resendKey,
      source: "resend",
    };
  }

  // Host present without password — treat as incomplete (dev skip / prod fail at send)
  if (host) {
    const port = parsePort(process.env.SMTP_PORT, 587);
    return {
      host,
      port,
      secure: port === 465,
      user: user || undefined,
      pass: undefined,
      source: "smtp",
    };
  }

  return null;
}

/**
 * SMTP availability from env only — does not import nodemailer.
 * Safe for instrumentation and integration checks at startup.
 */
export function isSmtpConfigured(): boolean {
  const config = resolveSmtpConfig();
  return Boolean(config?.host && config.pass);
}

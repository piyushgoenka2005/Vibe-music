/** Canonical Vibe Music sender addresses for self-hosted SMTP. */
export const MAILBOX = {
  info: "info@vibemusic.in",
  support: "support@vibemusic.in",
  contact: "contact@vibemusic.in",
  orders: "orders@vibemusic.in",
  billing: "billing@vibemusic.in",
} as const;

export type MailboxKey = keyof typeof MAILBOX;

const MAILBOX_LABELS: Record<MailboxKey, string> = {
  info: "Vibe Music",
  support: "Vibe Music Support",
  contact: "Vibe Music Contact",
  orders: "Vibe Music Orders",
  billing: "Vibe Music Billing",
};

export function mailboxAddress(key: MailboxKey): string {
  return MAILBOX[key];
}

export function formatMailboxFrom(
  key: MailboxKey,
  displayName?: string
): string {
  const name = displayName?.trim() || MAILBOX_LABELS[key];
  return `${name} <${MAILBOX[key]}>`;
}

/** Default inbox for internal admin alerts (contact form, low stock, ops). */
export function getAdminNotificationRecipient(): string {
  return (
    process.env.SMTP_ADMIN_TO?.trim() ||
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    MAILBOX.support
  );
}

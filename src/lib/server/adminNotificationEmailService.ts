import "server-only";

import { BRAND } from "@/lib/brand";
import {
  formatMailboxFrom,
  getAdminNotificationRecipient,
  MAILBOX,
  type MailboxKey,
} from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";

export interface ContactFormNotificationInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactFormAdminNotification(
  input: ContactFormNotificationInput
): Promise<boolean> {
  const result = await sendMail({
    from: formatMailboxFrom("contact"),
    to: getAdminNotificationRecipient(),
    replyTo: input.email,
    subject: `[Contact] ${input.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;color:#222">
        <h2>New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        ${input.phone ? `<p><strong>Phone:</strong> ${escapeHtml(input.phone)}</p>` : ""}
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
      </div>
    `,
  });

  return result.ok;
}

export interface LowStockNotificationInput {
  productId: string;
  productName: string;
  sku: string;
  availableQuantity: number;
  lowStockThreshold: number;
}

export async function sendLowStockAdminNotification(
  input: LowStockNotificationInput
): Promise<boolean> {
  const adminUrl = `${BRAND.siteUrl}/admin/inventory`;

  const result = await sendMail({
    from: formatMailboxFrom("billing"),
    to: getAdminNotificationRecipient(),
    subject: `[Low stock] ${input.productName} (${input.sku})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;color:#222">
        <h2>Low stock alert</h2>
        <p><strong>Product:</strong> ${escapeHtml(input.productName)}</p>
        <p><strong>SKU:</strong> ${escapeHtml(input.sku)}</p>
        <p><strong>Available:</strong> ${input.availableQuantity} (threshold ${input.lowStockThreshold})</p>
        <p><a href="${adminUrl}">Open inventory in admin</a></p>
      </div>
    `,
  });

  return result.ok;
}

export async function sendAdminNotification(input: {
  subject: string;
  html: string;
  text?: string;
  from?: MailboxKey;
  to?: string | string[];
}): Promise<boolean> {
  const result = await sendMail({
    from: formatMailboxFrom(input.from ?? "support"),
    to: input.to ?? getAdminNotificationRecipient(),
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return result.ok;
}

export { MAILBOX, getAdminNotificationRecipient };

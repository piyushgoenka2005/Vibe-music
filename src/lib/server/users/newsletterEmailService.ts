import "server-only";

import { BRAND } from "@/lib/brand";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";

function buildWelcomeHtml(firstName?: string): string {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const shopUrl = BRAND.siteUrl;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
      <h1 style="color:#1a3a8f">You're on the list</h1>
      <p>${greeting}</p>
      <p>Thanks for subscribing to <strong>${BRAND.name}</strong>. We'll email you when new products land, popular gear is back in stock, and exclusive offers go live.</p>
      <p><a href="${shopUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Shop latest gear</a></p>
      <p style="font-size:13px;color:#666">You can unsubscribe anytime by replying to this email.</p>
    </div>
  `;
}

export async function sendNewsletterWelcomeEmail(input: {
  email: string;
  firstName?: string;
}): Promise<boolean> {
  const result = await sendMail({
    from: formatMailboxFrom("info"),
    to: input.email,
    replyTo: formatMailboxFrom("info"),
    subject: `You're subscribed to ${BRAND.name} updates`,
    html: buildWelcomeHtml(input.firstName),
  });

  return result.ok;
}

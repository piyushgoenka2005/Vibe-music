import "server-only";

import { BRAND } from "@/lib/brand";

function buildWelcomeHtml(firstName?: string): string {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const shopUrl = BRAND.siteUrl;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
      <h1 style="color:#1a3a8f">You're on the list</h1>
      <p>${greeting}</p>
      <p>Thanks for subscribing to <strong>${BRAND.name}</strong>. We'll email you when new products land, popular gear is back in stock, and exclusive offers go live.</p>
      <p><a href="${shopUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Shop latest gear</a></p>
      <p style="font-size:13px;color:#666">You can unsubscribe anytime by replying to any update email.</p>
    </div>
  `;
}

export async function sendNewsletterWelcomeEmail(input: {
  email: string;
  firstName?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.NEWSLETTER_EMAIL_FROM?.trim() ||
    process.env.ORDER_EMAIL_FROM?.trim() ||
    `${BRAND.name} <updates@${BRAND.domain}>`;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[newsletter-email] Skipped (no RESEND_API_KEY). Welcome → ${input.email}`
      );
    }
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: `You're subscribed to ${BRAND.name} updates`,
        html: buildWelcomeHtml(input.firstName),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[newsletter-email] Resend error:", response.status, body);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[newsletter-email] Failed to send:", error);
    return false;
  }
}

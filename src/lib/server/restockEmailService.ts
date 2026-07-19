import "server-only";

import { BRAND } from "@/lib/brand";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendRestockAvailableEmail(input: {
  email: string;
  productName: string;
  productSlug: string;
}): Promise<boolean> {
  const productUrl = `${BRAND.siteUrl}/product/${encodeURIComponent(input.productSlug)}`;
  const name = escapeHtml(input.productName);

  const result = await sendMail({
    from: formatMailboxFrom("orders"),
    to: input.email,
    replyTo: formatMailboxFrom("support"),
    subject: `${input.productName} is back in stock`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Back in stock</h1>
        <p>Good news — <strong>${name}</strong> is available again at ${escapeHtml(BRAND.name)}.</p>
        <p>
          <a href="${productUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            View product
          </a>
        </p>
        <p style="font-size:13px;color:#666">You asked us to notify you when this item was available to buy.</p>
      </div>
    `,
    text: `${input.productName} is back in stock at ${BRAND.name}.\nView: ${productUrl}`,
  });

  return result.ok;
}

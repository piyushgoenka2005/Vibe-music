import "server-only";

import { formatCurrency } from "@/utils/currency";
import type {
  LifecycleEvent,
  LifecycleRecipient,
  OrderContext,
  RenderedMessage,
} from "./types";

const BRAND = "Vibe Music";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibemusic.in";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Pure per-event template renderer. SMS stays under ~160 chars where
 * possible; push is title+body only; email is simple, responsive HTML.
 */
export function renderLifecycleMessage(
  event: LifecycleEvent,
  recipient: Pick<LifecycleRecipient, "customerName">,
  ctx: OrderContext
): RenderedMessage {
  const name = recipient.customerName?.trim() || "there";
  const orderRef = `#${ctx.orderId.slice(-8).toUpperCase()}`;
  const url = ctx.orderUrl ?? `${SITE}/track-order?orderId=${encodeURIComponent(ctx.orderId)}`;
  const total = typeof ctx.total === "number" ? formatCurrency(ctx.total) : "";
  const itemsHtml = (ctx.itemLines ?? [])
    .slice(0, 6)
    .map(
      (line) =>
        `<li style="margin:0 0 4px;color:#333">${esc(line)}</li>`
    )
    .join("");

  interface Copy {
    subject: string;
    headline: string;
    lines: string[];
    sms: string;
    pushTitle: string;
  }

  let copy: Copy;
  switch (event) {
    case "order_confirmed":
      copy = {
        subject: `Order confirmed ${orderRef} — ${BRAND}`,
        headline: "Your order is confirmed",
        lines: [
          `We've received your order ${orderRef}${total ? ` (${total})` : ""} and it's being prepared.`,
          "You'll get tracking details as soon as it ships.",
        ],
        sms: `${BRAND}: Order ${orderRef} confirmed. Track: ${url}`,
        pushTitle: "Order confirmed",
      };
      break;
    case "payment_failed":
      copy = {
        subject: `Payment issue on order ${orderRef} — ${BRAND}`,
        headline: "Your payment didn't go through",
        lines: [
          `The payment for order ${orderRef} failed or was not completed.`,
          "No amount was captured. You can safely retry checkout or resume payment.",
        ],
        sms: `${BRAND}: Payment for order ${orderRef} failed. Resume: ${url}`,
        pushTitle: "Payment failed",
      };
      break;
    case "packed":
      copy = {
        subject: `Order ${orderRef} packed — ${BRAND}`,
        headline: "Your gear is packed",
        lines: [`Order ${orderRef} has been packed and will ship shortly.`],
        sms: `${BRAND}: Order ${orderRef} packed.`,
        pushTitle: "Order packed",
      };
      break;
    case "shipped":
      copy = {
        subject: `Order ${orderRef} shipped — ${BRAND}`,
        headline: "Your order is on the way",
        lines: [
          `Order ${orderRef} has shipped${ctx.courier ? ` via ${ctx.courier}` : ""}.`,
          ctx.trackingNumber ? `Tracking number: ${ctx.trackingNumber}.` : "",
          "Track live from your account any time.",
        ].filter(Boolean),
        sms: `${BRAND}: Order ${orderRef} shipped.${ctx.trackingNumber ? ` Trk: ${ctx.trackingNumber}.` : ""} ${url}`,
        pushTitle: "Order shipped",
      };
      break;
    case "out_for_delivery":
      copy = {
        subject: `Order ${orderRef} out for delivery — ${BRAND}`,
        headline: "Out for delivery today",
        lines: [`Order ${orderRef} is out for delivery. Keep your phone handy!`],
        sms: `${BRAND}: Order ${orderRef} is out for delivery today.`,
        pushTitle: "Out for delivery",
      };
      break;
    case "delivered":
      copy = {
        subject: `Order ${orderRef} delivered — ${BRAND}`,
        headline: "Delivered — enjoy!",
        lines: [
          `Order ${orderRef} was delivered.`,
          "Love it? Leave a review — it helps other musicians pick the right gear.",
        ],
        sms: `${BRAND}: Order ${orderRef} delivered. Thank you!`,
        pushTitle: "Order delivered",
      };
      break;
    case "order_cancelled":
      copy = {
        subject: `Order ${orderRef} cancelled — ${BRAND}`,
        headline: "Your order has been cancelled",
        lines: [
          `Order ${orderRef} has been cancelled as requested.`,
          total ? "" : "",
        ].filter(Boolean),
        sms: `${BRAND}: Order ${orderRef} cancelled.`,
        pushTitle: "Order cancelled",
      };
      break;
    case "refund_initiated":
      copy = {
        subject: `Refund started for order ${orderRef} — ${BRAND}`,
        headline: "Your refund is on its way",
        lines: [
          `We've initiated the refund for order ${orderRef}${total ? ` (${total})` : ""}.`,
          "Banks typically credit it in 3-5 working days.",
        ],
        sms: `${BRAND}: Refund for order ${orderRef} initiated (3-5 working days).`,
        pushTitle: "Refund initiated",
      };
      break;
    case "rental_booked":
      copy = {
        subject: `Rental booking confirmed ${orderRef} — ${BRAND}`,
        headline: "Your rental is booked",
        lines: [`Booking ${orderRef} is confirmed. See you at pickup!`],
        sms: `${BRAND}: Rental booking ${orderRef} confirmed.`,
        pushTitle: "Rental booked",
      };
      break;
    case "rental_reminder":
      copy = {
        subject: `Rental return reminder ${orderRef} — ${BRAND}`,
        headline: "Rental return due soon",
        lines: [`A friendly reminder that rental ${orderRef} is due back soon.`],
        sms: `${BRAND}: Rental ${orderRef} return due soon.`,
        pushTitle: "Rental reminder",
      };
      break;
    default: {
      const exhaustive: never = event;
      throw new Error(`Unknown lifecycle event: ${String(exhaustive)}`);
    }
  }

  const bodyHtml = copy.lines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 10px">${esc(line)}</p>`)
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e8ec">
<tr><td style="background:#111;padding:16px 24px"><span style="color:#fff;font-weight:700;letter-spacing:2px">${BRAND}</span></td></tr>
<tr><td style="padding:24px">
<h1 style="font-size:20px;margin:0 0 12px;color:#111">${esc(copy.headline)}</h1>
<p style="margin:0 0 10px;color:#444">Hi ${esc(name)},</p>
${bodyHtml}
${itemsHtml ? `<ul style="margin:8px 0 12px;padding-left:18px">${itemsHtml}</ul>` : ""}
<a href="${url}" style="display:inline-block;margin-top:8px;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">View order</a>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eee;color:#888;font-size:12px">${BRAND} · Pro audio &amp; instruments · Reply to this email for help.</td></tr>
</table></td></tr></table></body></html>`;

  return {
    subject: copy.subject,
    html,
    text: [copy.headline, "", ...copy.lines.filter(Boolean), "", url].join("\n"),
    smsText: copy.sms,
    pushTitle: copy.pushTitle,
    pushBody: copy.lines[0] ?? "",
    url,
  };
}

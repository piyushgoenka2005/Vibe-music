import "server-only";

import { BRAND } from "@/lib/brand";
import { buildInvoiceAccessUrl } from "@/lib/security/invoiceAccessToken";
import type { Order } from "@/types/order";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOrderConfirmationHtml(order: Order): string {
  const trackUrl = `${BRAND.siteUrl}/track-order?orderId=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.email)}`;
  const invoiceUrl =
    buildInvoiceAccessUrl(
      order.id,
      order.email,
      `/orders/${order.id}/invoice`
    ) ?? `${BRAND.siteUrl}/orders/${order.id}/invoice?email=${encodeURIComponent(order.email)}`;
  const itemRows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatInr(item.price * item.quantity)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
      <h1 style="color:var(--brand-primary)">Order Confirmed</h1>
      <p>Hi ${order.customerName ?? order.shippingAddress.name},</p>
      <p>Thank you for shopping at ${BRAND.name}. Your order <strong>${order.id}</strong> has been placed.</p>
      <p><strong>Total:</strong> ${formatInr(order.total)}<br/>
      <strong>Payment:</strong> ${order.paymentStatus === "cod_pending" ? "Cash on Delivery" : order.paymentStatus}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px">Qty</th>
          <th style="padding:8px;text-align:right">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p><a href="${trackUrl}" style="display:inline-block;background:var(--brand-primary);color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Track your order</a></p>
      <p><a href="${invoiceUrl}" style="font-size:14px;color:#444">View invoice</a></p>
      <p style="font-size:13px;color:#666">Deliver to: ${order.shippingAddress.name}, ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.ORDER_EMAIL_FROM ?? `${BRAND.name} <orders@${BRAND.domain}>`;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[order-email] Skipped (no RESEND_API_KEY). Order ${order.id} → ${order.email}`
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
        to: [order.email],
        subject: `Your ${BRAND.name} order ${order.id.slice(0, 8).toUpperCase()} is confirmed`,
        html: buildOrderConfirmationHtml(order),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[order-email] Resend error:", response.status, body);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[order-email] Failed to send:", error);
    return false;
  }
}

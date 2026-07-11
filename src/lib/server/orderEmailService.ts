import "server-only";

import { BRAND } from "@/lib/brand";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { isPlacedOrder } from "@/lib/orderPlacement";
import { buildInvoiceAccessUrl } from "@/lib/security/invoiceAccessToken";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";
import type { Order } from "@/types/order";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOrderConfirmationHtml(order: Order): string {
  const trackParams = new URLSearchParams({ orderId: order.id });
  if (order.trackingToken) {
    trackParams.set("trackingToken", order.trackingToken);
  }
  const trackUrl = `${BRAND.siteUrl}/track-order?${trackParams.toString()}`;
  const invoiceUrl =
    buildInvoiceAccessUrl(
      order.id,
      order.email,
      `/api/invoices/${order.id}/html`
    ) ?? `${BRAND.siteUrl}/orders/${order.id}/invoice`;
  const invoiceNumber = order.invoice?.invoiceNumber;
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
      <p>Thank you for shopping at ${BRAND.name}. Your order <strong>${formatOrderIdDisplay(order.id)}</strong> has been placed.${invoiceNumber ? ` Invoice <strong>${invoiceNumber}</strong>.` : ""}</p>
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
      <p style="margin-top:20px">
        <a href="${invoiceUrl}" style="display:inline-block;background:#1253ed;color:#fff;padding:12px 20px;text-decoration:none;border-radius:999px;font-weight:600">View invoice</a>
      </p>
      <p style="font-size:13px;color:#666">Deliver to: ${order.shippingAddress.name}, ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
      <p style="font-size:13px;color:#666">Questions? Reply to this email or write to ${formatMailboxFrom("support")}.</p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(order: Order): Promise<boolean> {
  if (!isPlacedOrder(order)) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[order-email] Skipped confirmation for unplaced order ${order.id}`
      );
    }
    return false;
  }

  const invoiceNumber = order.invoice?.invoiceNumber;
  const result = await sendMail({
    from: formatMailboxFrom("orders"),
    to: order.email,
    replyTo: formatMailboxFrom("support"),
    subject: invoiceNumber
      ? `Order confirmed — Invoice ${invoiceNumber}`
      : `Your ${BRAND.name} order ${formatOrderIdDisplay(order.id)} is confirmed`,
    html: buildOrderConfirmationHtml(order),
  });

  return result.ok;
}

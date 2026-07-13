import "server-only";

import { BRAND } from "@/lib/brand";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";
import type { Order } from "@/types/order";

export async function sendShipmentUpdateEmail(input: {
  order: Order;
  trackingNumber: string;
  carrier?: string | null;
  carrierName?: string | null;
  status?: string | null;
}): Promise<boolean> {
  const { order, trackingNumber, carrier, carrierName, status } = input;
  const email = order.email?.trim();
  if (!email) return false;

  const trackParams = new URLSearchParams({ orderId: order.id });
  if (order.trackingToken) {
    trackParams.set("trackingToken", order.trackingToken);
  }
  const trackUrl = `${BRAND.siteUrl}/track-order?${trackParams.toString()}`;
  const carrierLabel = (carrierName || carrier || "carrier").trim();
  const statusLabel = (status || "updated").trim();
  const name = order.customerName ?? order.shippingAddress.name ?? "there";

  const result = await sendMail({
    from: formatMailboxFrom("orders"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Shipment update — ${formatOrderIdDisplay(order.id)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Shipment update</h1>
        <p>Hi ${name},</p>
        <p>Your order <strong>${formatOrderIdDisplay(order.id)}</strong> has a shipment update.</p>
        <p>
          <strong>Tracking:</strong> ${trackingNumber}<br/>
          <strong>Carrier:</strong> ${carrierLabel}<br/>
          <strong>Status:</strong> ${statusLabel}
        </p>
        <p>
          <a href="${trackUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            Track your order
          </a>
        </p>
        <p style="font-size:13px;color:#666">Questions? Reply to this email or write to ${formatMailboxFrom("support")}.</p>
      </div>
    `,
    text: `Shipment update for ${formatOrderIdDisplay(order.id)}\nTracking: ${trackingNumber}\nCarrier: ${carrierLabel}\nStatus: ${statusLabel}\nTrack: ${trackUrl}`,
  });

  if (!result.ok) {
    console.error(`[shipment-email] Failed for order ${order.id} → ${email}`);
  }

  return result.ok;
}

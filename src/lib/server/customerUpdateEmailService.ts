import "server-only";

import { BRAND } from "@/lib/brand";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { formatMailboxFrom } from "@/lib/server/email/mailboxes";
import { sendMail } from "@/lib/server/email/smtp";
import type { Order, OrderStatus } from "@/types/order";
import type { ReturnRequest } from "@/types/returnRequest";
import type { SupportTicket } from "@/types/supportTicket";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export async function sendOrderStatusUpdateEmail(input: {
  order: Order;
  previousStatus: OrderStatus;
}): Promise<boolean> {
  const { order, previousStatus } = input;
  const email = order.email?.trim();
  if (!email) return false;
  if (order.status === previousStatus) return false;

  const trackParams = new URLSearchParams({ orderId: order.id });
  if (order.trackingToken) {
    trackParams.set("trackingToken", order.trackingToken);
  }
  const trackUrl = `${BRAND.siteUrl}/track-order?${trackParams.toString()}`;
  const name = escapeHtml(
    order.customerName ?? order.shippingAddress.name ?? "there"
  );
  const label = STATUS_LABELS[order.status] ?? order.status;
  const orderDisplay = formatOrderIdDisplay(order.id);

  const result = await sendMail({
    from: formatMailboxFrom("orders"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Order update — ${orderDisplay} is ${label.toLowerCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Order update</h1>
        <p>Hi ${name},</p>
        <p>Your order <strong>${escapeHtml(orderDisplay)}</strong> is now <strong>${escapeHtml(label)}</strong>.</p>
        <p>
          <a href="${trackUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            Track your order
          </a>
        </p>
        <p style="font-size:13px;color:#666">Questions? Reply to this email or write to ${formatMailboxFrom("support")}.</p>
      </div>
    `,
    text: `Order ${orderDisplay} is now ${label}. Track: ${trackUrl}`,
  });

  return result.ok;
}

export async function sendOrderRefundEmail(order: Order): Promise<boolean> {
  const email = order.email?.trim();
  if (!email) return false;

  const name = escapeHtml(
    order.customerName ?? order.shippingAddress.name ?? "there"
  );
  const orderDisplay = formatOrderIdDisplay(order.id);
  const accountUrl = `${BRAND.siteUrl}/account/orders/${order.id}`;

  const result = await sendMail({
    from: formatMailboxFrom("orders"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Refund processed — ${orderDisplay}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Refund processed</h1>
        <p>Hi ${name},</p>
        <p>A refund was issued for order <strong>${escapeHtml(orderDisplay)}</strong>.</p>
        <p>Depending on your bank, it may take a few business days to appear.</p>
        <p>
          <a href="${accountUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            View order
          </a>
        </p>
        <p style="font-size:13px;color:#666">Questions? Reply to this email or write to ${formatMailboxFrom("support")}.</p>
      </div>
    `,
    text: `A refund was issued for order ${orderDisplay}. View: ${accountUrl}`,
  });

  return result.ok;
}

export async function sendReturnStatusEmail(input: {
  returnRequest: ReturnRequest;
  status: string;
}): Promise<boolean> {
  const email = input.returnRequest.email?.trim();
  if (!email) return false;

  const statusLabel = input.status.replace(/_/g, " ");
  const orderDisplay = formatOrderIdDisplay(input.returnRequest.orderId);
  const link = `${BRAND.siteUrl}/account/orders/${input.returnRequest.orderId}`;

  const result = await sendMail({
    from: formatMailboxFrom("support"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Return update — ${orderDisplay}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Return request update</h1>
        <p>Your return for order <strong>${escapeHtml(orderDisplay)}</strong> is now <strong>${escapeHtml(statusLabel)}</strong>.</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            View order
          </a>
        </p>
      </div>
    `,
    text: `Your return for order ${orderDisplay} is now ${statusLabel}. View: ${link}`,
  });

  return result.ok;
}

export async function sendSupportTicketUpdateEmail(input: {
  ticket: SupportTicket;
  status: string;
}): Promise<boolean> {
  const email = input.ticket.email?.trim();
  if (!email) return false;

  const statusLabel = input.status.replace(/_/g, " ");
  const subject = escapeHtml(input.ticket.subject);
  const name = escapeHtml(input.ticket.name || "there");
  const link = `${BRAND.siteUrl}/account/notifications`;

  const result = await sendMail({
    from: formatMailboxFrom("support"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Support update — ${input.ticket.subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Support ticket update</h1>
        <p>Hi ${name},</p>
        <p>Your ticket <strong>${subject}</strong> is now <strong>${escapeHtml(statusLabel)}</strong>.</p>
        <p>
          <a href="${link}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            View notifications
          </a>
        </p>
      </div>
    `,
    text: `Your ticket "${input.ticket.subject}" is now ${statusLabel}.`,
  });

  return result.ok;
}

export async function sendProductQuestionAnswerEmail(input: {
  email: string;
  productName: string;
  productSlug: string;
  question: string;
  answer: string;
}): Promise<boolean> {
  const email = input.email.trim();
  if (!email) return false;

  const productUrl = `${BRAND.siteUrl}/product/${encodeURIComponent(input.productSlug)}`;
  const productName = escapeHtml(input.productName);
  const question = escapeHtml(input.question);
  const answer = escapeHtml(input.answer);

  const result = await sendMail({
    from: formatMailboxFrom("support"),
    to: email,
    replyTo: formatMailboxFrom("support"),
    subject: `Answered: ${input.productName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
        <h1 style="color:#1a3a8f">Your question was answered</h1>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Question:</strong> ${question}</p>
        <p><strong>Answer:</strong> ${answer}</p>
        <p>
          <a href="${productUrl}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
            View product
          </a>
        </p>
      </div>
    `,
    text: `Your question about ${input.productName} was answered.\nQ: ${input.question}\nA: ${input.answer}\n${productUrl}`,
  });

  return result.ok;
}

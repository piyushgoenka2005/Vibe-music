import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
} from "@/types/order";

export function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case "razorpay":
      return "Online Payment (Razorpay)";
    case "cod":
      return "Cash on Delivery";
    default:
      return method;
  }
}

export function formatShippingAddress(address: ShippingAddress): string {
  const lines = [
    address.name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
    address.phone ? `Phone: ${address.phone}` : undefined,
  ].filter(Boolean);

  return lines.join("\n");
}

export function formatTimelineDate(date?: string): string {
  if (!date) return "Pending";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status: OrderStatus): string {
  return `acct__badge acct__badge--${status}`;
}

export function formatOrderDate(date?: string): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPaymentLabel(status: PaymentStatus): string {
  switch (status) {
    case "cod_pending":
      return "Cash on Delivery";
    case "paid":
      return "Paid";
    case "pending":
      return "Payment Pending";
    case "failed":
      return "Payment Failed";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

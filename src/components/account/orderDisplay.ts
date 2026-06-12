import type { OrderStatus, PaymentStatus } from "@/types/order";

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

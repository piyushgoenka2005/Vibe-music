import "server-only";

import { toPaise } from "@/lib/gstCalculator";
import type { Order } from "@/types/order";

/** Reject captured payments that do not match the server-authoritative order total. */
export function assertRazorpayAmountMatchesOrder(
  order: Pick<Order, "total">,
  amountPaise: number,
): void {
  const expected = toPaise(order.total);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error("Invalid Razorpay payment amount");
  }
  if (amountPaise !== expected) {
    throw new Error(
      `Payment amount mismatch: expected ${expected} paise for order total ₹${order.total}, received ${amountPaise} paise`,
    );
  }
}

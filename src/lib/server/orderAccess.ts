import "server-only";

import type { Order } from "@/types/order";

export function canAccessOrder(
  order: Order,
  context: { userId?: string; email?: string }
): boolean {
  if (context.userId && order.userId === context.userId) {
    return true;
  }

  const normalizedEmail = context.email?.trim().toLowerCase();
  if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) {
    return true;
  }

  if (
    context.userId &&
    context.email &&
    order.email?.toLowerCase() === context.email.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

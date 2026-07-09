import "server-only";

import {
  isLegacyOrderTrackingDevFallbackEnabled,
  verifyOrderTrackingToken,
} from "@/lib/server/orderTrackingToken";
import type { Order } from "@/types/order";

export {
  isPaymentVerified,
  isInvoiceGenerated,
  isPlacedOrder,
  orderNeedsPlacementRefresh,
} from "@/lib/orderPlacement";

export function canAccessOrder(
  order: Order,
  context: { userId?: string; email?: string; trackingToken?: string }
): boolean {
  if (context.userId && order.userId === context.userId) {
    return true;
  }

  const trackingToken = context.trackingToken?.trim();
  if (trackingToken && verifyOrderTrackingToken(order, trackingToken)) {
    return true;
  }

  if (
    context.userId &&
    context.email &&
    order.email?.toLowerCase() === context.email.trim().toLowerCase()
  ) {
    return true;
  }

  if (isLegacyOrderTrackingDevFallbackEnabled()) {
    const normalizedEmail = context.email?.trim().toLowerCase();
    if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) {
      return true;
    }
  }

  return false;
}

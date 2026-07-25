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
  // Owner access: order must be linked to this account (guest orders link on login).
  if (context.userId && order.userId === context.userId) {
    return true;
  }

  const trackingToken = context.trackingToken?.trim();
  if (trackingToken && verifyOrderTrackingToken(order, trackingToken)) {
    return true;
  }

  // Production: never grant access from email match alone — registering with a
  // guest order email must not unlock that order without the tracking token.
  if (isLegacyOrderTrackingDevFallbackEnabled()) {
    const normalizedEmail = context.email?.trim().toLowerCase();
    if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) {
      return true;
    }
  }

  return false;
}

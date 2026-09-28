import type { CartPromotionsPublic } from "@/lib/cart/cartPromotions";
import { isFreeShippingUnlocked } from "@/lib/cart/promoGift";
import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";
import { formatDisplayPrice } from "@/utils/currency";

export interface CartShippingState {
  unlocked: boolean;
  label: string;
  detail: string;
  amountLabel: string;
}

export function buildCartShippingState(
  paidSubtotal: number,
  config: CartPromotionsPublic | null,
): CartShippingState {
  // Match checkout: free shipping is the default storefront policy.
  const threshold = config?.freeShippingThreshold ?? 0;
  const unlocked = isFreeShippingUnlocked(paidSubtotal, threshold);

  if (unlocked || threshold <= 0) {
    return {
      unlocked: true,
      label: SHIPPING_POLICY.cartBanner,
      detail: "Standard delivery · Dispatches in 1–2 business days",
      amountLabel: "FREE",
    };
  }

  const remaining = Math.max(0, threshold - paidSubtotal);
  return {
    unlocked: false,
    label: "Shipping calculated at checkout",
    detail: `Add ${formatDisplayPrice(remaining)} more for free shipping`,
    amountLabel: "At checkout",
  };
}

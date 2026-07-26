export interface PdpPricingState {
  displayPrice: number;
  mrp: number | null;
  savingsAmount: number;
  savingsPercent: number;
  hasDiscount: boolean;
}

export interface PdpOfferRow {
  id: string;
  title: string;
  detail: string;
  offerCount: number;
}

export function resolvePdpPricing(
  displayPrice: number,
  msrp: number | null,
  originalPrice?: number
): PdpPricingState {
  const resolvedMrp =
    msrp != null && msrp > displayPrice
      ? msrp
      : originalPrice != null && originalPrice > displayPrice
        ? originalPrice
        : null;

  const savingsAmount =
    resolvedMrp != null ? Math.max(0, resolvedMrp - displayPrice) : 0;
  const savingsPercent =
    resolvedMrp != null && resolvedMrp > 0
      ? Math.round((savingsAmount / resolvedMrp) * 100)
      : 0;

  return {
    displayPrice,
    mrp: resolvedMrp,
    savingsAmount,
    savingsPercent,
    hasDiscount: savingsAmount > 0,
  };
}

export function buildPdpOfferRows(_price: number): PdpOfferRow[] {
  // Offer cards are only shown when wired to real coupon/partner data.
  return [];
}

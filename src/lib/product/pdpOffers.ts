import {
  formatCurrencyPrecise,
  isPurchasablePrice,
} from "@/utils/currency";

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

export function buildPdpOfferRows(price: number): PdpOfferRow[] {
  if (!isPurchasablePrice(price)) return [];

  const bankCap = Math.min(2500, Math.round(price * 0.03));
  const cashbackCap = Math.max(99, Math.round(price * 0.015));

  return [
    {
      id: "bank",
      title: "Bank Offer",
      detail: `Upto ${formatCurrencyPrecise(bankCap)} discount on select Credit Cards`,
      offerCount: 36,
    },
    {
      id: "cashback",
      title: "Cashback",
      detail: `Upto ${formatCurrencyPrecise(cashbackCap)} cashback as wallet balance when you pay with partner cards`,
      offerCount: 1,
    },
    {
      id: "partner",
      title: "Partner Offers",
      detail: "Get GST invoice and save up to 18% on business purchases.",
      offerCount: 1,
    },
  ];
}

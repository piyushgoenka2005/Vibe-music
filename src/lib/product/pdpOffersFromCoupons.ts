import type { StorefrontCouponOffer } from "@/types/coupon";
import type { PdpOfferRow } from "@/lib/product/pdpOffers";
import { formatCurrency } from "@/utils/currency";

function offerHeadline(coupon: StorefrontCouponOffer): string {
  if (coupon.label.trim()) return coupon.label;
  if (coupon.type === "percentage") return `${coupon.value}% off this item`;
  if (coupon.type === "free_shipping") return "Free shipping on this item";
  return `₹${coupon.value} off this item`;
}

export function buildPdpOfferRowsFromCoupons(coupons: StorefrontCouponOffer[]): PdpOfferRow[] {
  return coupons.map((coupon) => {
    const minLabel =
      coupon.minOrderAmount != null && coupon.minOrderAmount > 0
        ? `Min order ${formatCurrency(coupon.minOrderAmount)}`
        : "Apply at checkout";

    return {
      id: coupon.code,
      title: offerHeadline(coupon),
      detail: `${minLabel} · Code ${coupon.code}`,
      offerCount: 1,
    };
  });
}

export function buildPdpCouponPromoMessage(coupon: StorefrontCouponOffer): string {
  if (coupon.type === "percentage") {
    return `Save ${coupon.value}% on this item — apply coupon ${coupon.code} at checkout`;
  }
  if (coupon.type === "free_shipping") {
    return `Free shipping on this item — apply coupon ${coupon.code} at checkout`;
  }
  if (coupon.type === "flat") {
    return `Save ₹${coupon.value} on this item — apply coupon ${coupon.code} at checkout`;
  }
  return `Special offer — apply coupon ${coupon.code} at checkout`;
}

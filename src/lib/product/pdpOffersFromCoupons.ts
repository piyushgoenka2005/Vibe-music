import { buildProductCouponCopy } from "@/lib/product/productCouponDisplay";
import type { StorefrontCouponOffer } from "@/types/coupon";
import type { PdpOfferRow } from "@/lib/product/pdpOffers";

export function buildPdpOfferRowsFromCoupons(coupons: StorefrontCouponOffer[]): PdpOfferRow[] {
  return coupons.map((coupon) => {
    const copy = buildProductCouponCopy(coupon);
    const detailParts = [copy.termsLine, copy.maxDiscountLine, copy.disclaimer].filter(Boolean);

    return {
      id: coupon.code,
      title: copy.headline,
      detail: detailParts.length > 0 ? detailParts.join(" · ") : `Code ${copy.code}`,
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

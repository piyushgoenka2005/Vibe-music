import type { StorefrontCouponOffer } from "@/types/coupon";
import type { PdpOfferRow } from "@/lib/product/pdpOffers";
import { formatCurrency } from "@/utils/currency";

export function buildPdpOfferRowsFromCoupons(
  coupons: StorefrontCouponOffer[]
): PdpOfferRow[] {
  return coupons.map((coupon) => {
    const minLabel =
      coupon.minOrderAmount != null && coupon.minOrderAmount > 0
        ? `Min order ${formatCurrency(coupon.minOrderAmount)}`
        : "Apply at checkout";

    return {
      id: coupon.code,
      title: coupon.label || coupon.code,
      detail: `${minLabel} · Code ${coupon.code}`,
      offerCount: 1,
    };
  });
}

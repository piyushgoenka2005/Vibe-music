import { resolveCouponPdpCopy, type ResolvedCouponPdpCopy } from "@/lib/coupons/couponPdpDisplay";
import type { StorefrontCouponOffer } from "@/types/coupon";

export type ProductCouponCopy = ResolvedCouponPdpCopy;

export function buildProductCouponCopy(coupon: StorefrontCouponOffer): ProductCouponCopy {
  return resolveCouponPdpCopy(coupon);
}

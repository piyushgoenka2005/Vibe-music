import {
  getCouponEligibleSubtotal,
  type CouponCartLineItem as ScopeCartLine,
} from "@/lib/coupons/couponProductScope";
import type { AppliedCouponSnapshot, CouponCartLineItem, CouponType } from "@/types/coupon";

export function isFreeShippingCouponType(type: CouponType): boolean {
  return type === "free_shipping";
}

function toScopeLines(items: CouponCartLineItem[]): ScopeCartLine[] {
  return items.map((item) => ({
    productId: item.productId,
    lineTotal: item.price * item.quantity,
  }));
}

/** True when an applied coupon waives shipping for the current cart lines. */
export function couponQualifiesForFreeShipping(
  coupon: Pick<AppliedCouponSnapshot, "type" | "scope" | "productIds"> | null | undefined,
  items: CouponCartLineItem[],
  cartSubtotal: number,
): boolean {
  if (!coupon || !isFreeShippingCouponType(coupon.type)) return false;

  const scope = coupon.scope ?? "store";
  const eligibleSubtotal = getCouponEligibleSubtotal(
    cartSubtotal,
    toScopeLines(items),
    scope,
    coupon.productIds,
  );

  return eligibleSubtotal > 0;
}

export function resolveShippingChargeWithCoupon(
  baseShippingCharge: number,
  coupon: Pick<AppliedCouponSnapshot, "type" | "scope" | "productIds"> | null | undefined,
  items: CouponCartLineItem[],
  cartSubtotal: number,
): number {
  if (couponQualifiesForFreeShipping(coupon, items, cartSubtotal)) {
    return 0;
  }
  return baseShippingCharge;
}

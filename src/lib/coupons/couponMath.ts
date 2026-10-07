import {
  getCouponEligibleSubtotal,
  getCouponProductScopeError,
  type CouponCartLineItem,
  type CouponProductScopeRule,
} from "@/lib/coupons/couponProductScope";
import type { CouponDiscountRule, CouponEligibilityRule, CouponScope } from "@/types/coupon";

/** Rupee discount for a subtotal — same formula used at checkout. */
export function calculateCouponDiscountAmount(
  subtotal: number,
  coupon: CouponDiscountRule,
): number {
  if (subtotal <= 0) return 0;

  if (coupon.type === "free_shipping") {
    return 0;
  }

  if (coupon.type === "percentage") {
    return Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  }

  return Math.min(coupon.value, subtotal);
}

/** Returns an error message when the coupon cannot be applied, else null. */
export function getCouponEligibilityError(
  coupon: CouponEligibilityRule,
  subtotal: number,
  now: Date = new Date(),
): string | null {
  if (!coupon.isActive) return "Coupon is inactive";

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return "Coupon not yet active";
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return "Coupon has expired";
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return "Coupon usage limit reached";
  }

  if (coupon.maxUsesPerUser != null && (coupon.userRedemptionCount ?? 0) >= coupon.maxUsesPerUser) {
    return "You have already used this coupon";
  }

  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    return `Minimum order amount is ₹${coupon.minOrderAmount}`;
  }

  return null;
}

export interface CouponValidationInput
  extends CouponEligibilityRule, CouponDiscountRule, CouponProductScopeRule {
  code: string;
  label: string;
}

export function validateCouponForSubtotal(
  coupon: CouponValidationInput,
  subtotal: number,
  options?: { items?: CouponCartLineItem[]; now?: Date },
): { valid: true; discount: number; eligibleSubtotal: number } | { valid: false; error: string } {
  const scope = coupon.scope ?? "store";
  const scopeError = getCouponProductScopeError(
    { scope, productIds: coupon.productIds },
    options?.items,
    subtotal,
  );
  if (scopeError) {
    return { valid: false, error: scopeError };
  }

  const eligibleSubtotal = getCouponEligibleSubtotal(
    subtotal,
    options?.items,
    scope,
    coupon.productIds,
  );

  const eligibilityError = getCouponEligibilityError(coupon, eligibleSubtotal, options?.now);
  if (eligibilityError) {
    return { valid: false, error: eligibilityError };
  }

  return {
    valid: true,
    eligibleSubtotal,
    discount: calculateCouponDiscountAmount(eligibleSubtotal, coupon),
  };
}

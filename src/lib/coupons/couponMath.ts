import type { CouponDiscountRule, CouponEligibilityRule } from "@/types/coupon";

/** Rupee discount for a subtotal — same formula used at checkout. */
export function calculateCouponDiscountAmount(
  subtotal: number,
  coupon: CouponDiscountRule
): number {
  if (subtotal <= 0) return 0;

  if (coupon.type === "percentage") {
    return Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  }

  return Math.min(coupon.value, subtotal);
}

/** Returns an error message when the coupon cannot be applied, else null. */
export function getCouponEligibilityError(
  coupon: CouponEligibilityRule,
  subtotal: number,
  now: Date = new Date()
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

  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    return `Minimum order amount is ₹${coupon.minOrderAmount}`;
  }

  return null;
}

export function validateCouponForSubtotal(
  coupon: CouponEligibilityRule & CouponDiscountRule & { code: string; label: string },
  subtotal: number,
  now?: Date
): { valid: true; discount: number } | { valid: false; error: string } {
  const eligibilityError = getCouponEligibilityError(coupon, subtotal, now);
  if (eligibilityError) {
    return { valid: false, error: eligibilityError };
  }

  return {
    valid: true,
    discount: calculateCouponDiscountAmount(subtotal, coupon),
  };
}

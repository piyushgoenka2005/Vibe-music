export type CouponType = "percentage" | "flat";

/** Coupon fields required to compute discount (shared client + server). */
export interface CouponDiscountRule {
  type: CouponType;
  value: number;
}

/** Coupon fields required for eligibility checks (shared client + server). */
export interface CouponEligibilityRule {
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  minOrderAmount?: number;
}

/** Snapshot stored in cart after successful validation. */
export interface AppliedCouponSnapshot {
  code: string;
  label: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  error?: string;
  coupon?: AppliedCouponSnapshot;
}

export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
}

export interface ValidateCouponResponse {
  result: CouponValidationResult;
}

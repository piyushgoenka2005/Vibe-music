export type CouponType = "percentage" | "flat" | "free_shipping";

/** store = discount on full cart; products = only assigned catalog items */
export type CouponScope = "store" | "products";

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
  maxUsesPerUser?: number;
  userRedemptionCount?: number;
  usedCount: number;
  minOrderAmount?: number;
}

export interface CouponValidateContext {
  userId?: string | null;
  customerEmail?: string | null;
}

export interface CouponRedemptionContext extends CouponValidateContext {
  orderId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

/** Snapshot stored in cart after successful validation. */
export interface AppliedCouponSnapshot {
  code: string;
  label: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  scope?: CouponScope;
  productIds?: string[];
}

export interface CouponCartLineItem {
  productId: string;
  quantity: number;
  price: number;
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
  items?: CouponCartLineItem[];
  customerEmail?: string;
}

export interface ValidateCouponResponse {
  result: CouponValidationResult;
}

/** Public storefront coupon row for PDP offer cards and marketing surfaces. */
export interface StorefrontCouponOffer {
  code: string;
  label: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  scope?: CouponScope;
  productIds?: string[];
}

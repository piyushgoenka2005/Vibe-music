import type { CouponScope } from "@/types/coupon";

export interface CouponCartLineItem {
  productId: string;
  lineTotal: number;
}

export interface CouponProductScopeRule {
  scope: CouponScope;
  productIds?: string[];
}

export function normalizeCouponProductIds(productIds?: string[] | null): string[] {
  if (!productIds?.length) return [];
  return [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
}

export function isProductScopedCoupon(scope: CouponScope, productIds?: string[]): boolean {
  return scope === "products" && normalizeCouponProductIds(productIds).length > 0;
}

/** Subtotal eligible for discount — full cart or matching product lines only. */
export function getCouponEligibleSubtotal(
  cartSubtotal: number,
  items: CouponCartLineItem[] | undefined,
  scope: CouponScope,
  productIds?: string[],
): number {
  if (!isProductScopedCoupon(scope, productIds)) {
    return cartSubtotal;
  }

  const allowed = new Set(normalizeCouponProductIds(productIds));
  if (!items?.length) return 0;

  return items
    .filter((item) => allowed.has(item.productId))
    .reduce((sum, item) => sum + item.lineTotal, 0);
}

export function getCouponProductScopeError(
  rule: CouponProductScopeRule,
  items: CouponCartLineItem[] | undefined,
  cartSubtotal: number,
): string | null {
  if (!isProductScopedCoupon(rule.scope, rule.productIds)) {
    return null;
  }

  const eligible = getCouponEligibleSubtotal(cartSubtotal, items, rule.scope, rule.productIds);

  if (eligible <= 0) {
    return "This coupon does not apply to items in your cart";
  }

  return null;
}

export function couponAppliesToProduct(rule: CouponProductScopeRule, productId: string): boolean {
  if (!isProductScopedCoupon(rule.scope, rule.productIds)) {
    return true;
  }
  return normalizeCouponProductIds(rule.productIds).includes(productId);
}

/** True when a coupon can be used with at least one product in the cart. */
export function couponAppliesToAnyProduct(
  rule: CouponProductScopeRule,
  productIds: string[],
): boolean {
  if (!productIds.length) return false;
  if (!isProductScopedCoupon(rule.scope, rule.productIds)) {
    return true;
  }
  const allowed = new Set(normalizeCouponProductIds(rule.productIds));
  return productIds.some((id) => allowed.has(id));
}

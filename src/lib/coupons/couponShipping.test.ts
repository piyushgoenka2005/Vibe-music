import { describe, expect, it } from "vitest";
import {
  couponQualifiesForFreeShipping,
  resolveShippingChargeWithCoupon,
} from "@/lib/coupons/couponShipping";

describe("couponShipping", () => {
  it("waives shipping for product-scoped free shipping coupons", () => {
    const coupon = {
      type: "free_shipping" as const,
      scope: "products" as const,
      productIds: ["p1"],
    };
    const items = [{ productId: "p1", quantity: 1, price: 2000 }];

    expect(couponQualifiesForFreeShipping(coupon, items, 2000)).toBe(true);
    expect(resolveShippingChargeWithCoupon(199, coupon, items, 2000)).toBe(0);
  });

  it("does not waive shipping when cart has no eligible products", () => {
    const coupon = {
      type: "free_shipping" as const,
      scope: "products" as const,
      productIds: ["p1"],
    };
    const items = [{ productId: "p2", quantity: 1, price: 2000 }];

    expect(couponQualifiesForFreeShipping(coupon, items, 2000)).toBe(false);
    expect(resolveShippingChargeWithCoupon(199, coupon, items, 2000)).toBe(199);
  });
});

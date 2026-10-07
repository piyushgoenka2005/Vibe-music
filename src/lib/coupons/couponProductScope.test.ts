import { describe, expect, it } from "vitest";
import {
  couponAppliesToAnyProduct,
  couponAppliesToProduct,
  getCouponEligibleSubtotal,
  getCouponProductScopeError,
} from "@/lib/coupons/couponProductScope";

describe("couponProductScope", () => {
  it("returns full subtotal for storewide coupons", () => {
    expect(
      getCouponEligibleSubtotal(5000, [{ productId: "a", lineTotal: 2000 }], "store", []),
    ).toBe(5000);
  });

  it("sums only matching product lines", () => {
    expect(
      getCouponEligibleSubtotal(
        5000,
        [
          { productId: "a", lineTotal: 2000 },
          { productId: "b", lineTotal: 3000 },
        ],
        "products",
        ["a"],
      ),
    ).toBe(2000);
  });

  it("rejects product coupons with no eligible cart lines", () => {
    expect(
      getCouponProductScopeError(
        { scope: "products", productIds: ["a"] },
        [{ productId: "b", lineTotal: 1000 }],
        1000,
      ),
    ).toBe("This coupon does not apply to items in your cart");
  });

  it("filters PDP offers by product", () => {
    expect(couponAppliesToProduct({ scope: "products", productIds: ["a"] }, "a")).toBe(true);
    expect(couponAppliesToProduct({ scope: "products", productIds: ["a"] }, "b")).toBe(false);
    expect(couponAppliesToProduct({ scope: "store", productIds: [] }, "b")).toBe(true);
  });

  it("matches cart when any line is eligible", () => {
    expect(
      couponAppliesToAnyProduct({ scope: "products", productIds: ["a", "b"] }, ["b", "c"]),
    ).toBe(true);
    expect(couponAppliesToAnyProduct({ scope: "products", productIds: ["a"] }, ["c"])).toBe(false);
  });
});

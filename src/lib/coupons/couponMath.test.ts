import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscountAmount,
  getCouponEligibilityError,
  validateCouponForSubtotal,
} from "@/lib/coupons/couponMath";

describe("calculateCouponDiscountAmount", () => {
  it("applies percentage discounts", () => {
    expect(calculateCouponDiscountAmount(1000, { type: "percentage", value: 10 })).toBe(100);
  });

  it("caps flat discounts at subtotal", () => {
    expect(calculateCouponDiscountAmount(500, { type: "flat", value: 800 })).toBe(500);
  });

  it("returns zero discount for free shipping coupons", () => {
    expect(calculateCouponDiscountAmount(5000, { type: "free_shipping", value: 0 })).toBe(0);
  });
});

describe("getCouponEligibilityError", () => {
  it("rejects inactive coupons", () => {
    expect(getCouponEligibilityError({ isActive: false, usedCount: 0 }, 1000)).toBe(
      "Coupon is inactive",
    );
  });

  it("enforces minimum order value", () => {
    expect(
      getCouponEligibilityError({ isActive: true, usedCount: 0, minOrderAmount: 2000 }, 1500),
    ).toBe("Minimum order amount is ₹2000");
  });

  it("enforces per-user usage limits", () => {
    expect(
      getCouponEligibilityError(
        { isActive: true, usedCount: 0, maxUsesPerUser: 1, userRedemptionCount: 1 },
        1000,
      ),
    ).toBe("You have already used this coupon");
  });
});

describe("validateCouponForSubtotal", () => {
  it("returns discount when valid", () => {
    const result = validateCouponForSubtotal(
      {
        code: "SAVE10",
        label: "10% off",
        type: "percentage",
        value: 10,
        isActive: true,
        usedCount: 0,
      },
      1000,
    );
    expect(result).toEqual({ valid: true, discount: 100, eligibleSubtotal: 1000 });
  });

  it("applies product-scoped coupons to eligible lines only", () => {
    const result = validateCouponForSubtotal(
      {
        code: "GUITAR10",
        label: "Guitar 10%",
        type: "percentage",
        value: 10,
        isActive: true,
        usedCount: 0,
        scope: "products",
        productIds: ["p1"],
      },
      5000,
      {
        items: [
          { productId: "p1", lineTotal: 2000 },
          { productId: "p2", lineTotal: 3000 },
        ],
      },
    );

    expect(result).toEqual({ valid: true, discount: 200, eligibleSubtotal: 2000 });
  });
});

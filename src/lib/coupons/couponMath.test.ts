import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscountAmount,
  getCouponEligibilityError,
  validateCouponForSubtotal,
} from "@/lib/coupons/couponMath";

describe("calculateCouponDiscountAmount", () => {
  it("applies percentage discounts", () => {
    expect(
      calculateCouponDiscountAmount(1000, { type: "percentage", value: 10 })
    ).toBe(100);
  });

  it("caps flat discounts at subtotal", () => {
    expect(calculateCouponDiscountAmount(500, { type: "flat", value: 800 })).toBe(
      500
    );
  });
});

describe("getCouponEligibilityError", () => {
  it("rejects inactive coupons", () => {
    expect(
      getCouponEligibilityError(
        { isActive: false, usedCount: 0 },
        1000
      )
    ).toBe("Coupon is inactive");
  });

  it("enforces minimum order value", () => {
    expect(
      getCouponEligibilityError(
        { isActive: true, usedCount: 0, minOrderAmount: 2000 },
        1500
      )
    ).toBe("Minimum order amount is ₹2000");
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
      1000
    );
    expect(result).toEqual({ valid: true, discount: 100 });
  });
});

import { describe, expect, it } from "vitest";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";

describe("formatCouponLabel", () => {
  it("uses custom label when provided", () => {
    expect(formatCouponLabel({ label: "Launch promo", type: "percentage", value: 10 })).toBe(
      "Launch promo",
    );
  });

  it("formats percentage coupons", () => {
    expect(formatCouponLabel({ label: "", type: "percentage", value: 15 })).toBe("15% off");
  });

  it("formats flat coupons", () => {
    expect(formatCouponLabel({ label: "", type: "flat", value: 500 })).toBe("₹500 off");
  });

  it("formats free shipping coupons", () => {
    expect(formatCouponLabel({ label: "", type: "free_shipping", value: 0 })).toBe("Free shipping");
  });
});

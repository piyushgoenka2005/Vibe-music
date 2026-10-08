import { describe, expect, it } from "vitest";
import { buildProductCouponCopy } from "@/lib/product/productCouponDisplay";
import type { StorefrontCouponOffer } from "@/types/coupon";

describe("buildProductCouponCopy", () => {
  it("uses admin-authored PDP fields when provided", () => {
    const coupon: StorefrontCouponOffer = {
      code: "PUJO15",
      label: "PUJO SPECIAL — GET 15% OFF",
      type: "percentage",
      value: 15,
      minOrderAmount: 2999,
      maxDiscountAmount: 500,
      pdp: {
        headline: "🪔 PUJO SPECIAL — GET 15% OFF",
        offerLine: "🎉 15% OFF on orders above ₹2,999",
        maxDiscountLine: "Maximum Discount ₹500",
        termsLine: "*15% OFF up to ₹500 on orders above ₹2,999*",
        disclaimer: "Exclusions apply",
        footer: "Limited-time offer | T&C apply",
      },
    };

    const copy = buildProductCouponCopy(coupon);
    expect(copy.headline).toBe("🪔 PUJO SPECIAL — GET 15% OFF");
    expect(copy.disclaimer).toBe("Exclusions apply");
    expect(copy.buyBoxFooter).toBe("Limited-time offer | T&C apply");
  });

  it("derives copy from discount rules when admin leaves PDP fields blank", () => {
    const copy = buildProductCouponCopy({
      code: "SAVE10",
      label: "10% off",
      type: "percentage",
      value: 10,
      minOrderAmount: 1500,
      maxDiscountAmount: 300,
    });

    expect(copy.offerLine).toContain("10% OFF");
    expect(copy.maxDiscountLine).toBe("Maximum Discount ₹300");
    expect(copy.disclaimer).toBe("");
    expect(copy.buyBoxFooter).toBe("");
  });
});

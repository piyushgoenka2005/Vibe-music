import { describe, expect, it } from "vitest";
import { mapCouponPdpFields, resolveCouponPdpCopy } from "@/lib/coupons/couponPdpDisplay";

describe("couponPdpDisplay", () => {
  it("maps only non-empty admin PDP overrides", () => {
    expect(
      mapCouponPdpFields({
        pdpHeadline: "  Festive sale  ",
        pdpOfferLine: "",
        pdpDisclaimer: "T&C apply",
      }),
    ).toEqual({
      headline: "Festive sale",
      disclaimer: "T&C apply",
    });
  });

  it("derives storefront copy when admin fields are blank", () => {
    const copy = resolveCouponPdpCopy({
      code: "SAVE15",
      label: "15% off",
      type: "percentage",
      value: 15,
      minOrderAmount: 2000,
      maxDiscountAmount: 400,
    });

    expect(copy.headline).toBe("15% off");
    expect(copy.offerLine).toContain("15% OFF");
    expect(copy.maxDiscountLine).toBe("Maximum Discount ₹400");
    expect(copy.termsLine).toContain("₹2,000");
  });
});

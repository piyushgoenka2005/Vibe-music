import { describe, it, expect } from "vitest";
import { buildCouponShareUrl, parseUtmFromSearchParams } from "@/lib/coupons/couponShareUrl";

describe("buildCouponShareUrl", () => {
  it("builds checkout URL with coupon and UTM params", () => {
    const url = buildCouponShareUrl(
      {
        code: "save10",
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "summer",
        utmContent: "bio",
      },
      "https://vibemusic.in",
    );

    expect(url).toContain("https://vibemusic.in/checkout");
    expect(url).toContain("coupon=SAVE10");
    expect(url).toContain("utm_source=instagram");
    expect(url).toContain("utm_medium=social");
    expect(url).toContain("utm_campaign=summer");
    expect(url).toContain("utm_content=bio");
  });
});

describe("parseUtmFromSearchParams", () => {
  it("extracts UTM fields from search params", () => {
    const params = new URLSearchParams(
      "utm_source=email&utm_medium=newsletter&utm_campaign=launch",
    );
    expect(parseUtmFromSearchParams(params)).toEqual({
      utmSource: "email",
      utmMedium: "newsletter",
      utmCampaign: "launch",
      utmContent: undefined,
    });
  });
});

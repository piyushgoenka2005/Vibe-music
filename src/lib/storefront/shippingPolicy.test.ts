import { describe, expect, it } from "vitest";
import {
  buildShippingPolicyCopy,
  SHIPPING_POLICY,
  STOREFRONT_FREE_SHIPPING_THRESHOLD,
  storefrontShippingBannerText,
} from "@/lib/storefront/shippingPolicy";

describe("shippingPolicy", () => {
  it("uses free shipping on every order when threshold is 0", () => {
    expect(STOREFRONT_FREE_SHIPPING_THRESHOLD).toBe(0);
    const copy = buildShippingPolicyCopy({ freeShippingThreshold: 0 });
    const text = Object.values(copy).join(" ");
    expect(text).not.toMatch(/2,999|2999|above ₹|over ₹|qualifying/i);
    expect(text).toMatch(/every order/i);
    expect(storefrontShippingBannerText()).toBe(copy.cartBanner);
    expect(SHIPPING_POLICY.cartBanner).toBe(copy.cartBanner);
  });

  it("uses threshold copy when admin configures paid shipping", () => {
    const copy = buildShippingPolicyCopy({
      freeShippingThreshold: 2999,
      standardShippingCharge: 99,
    });
    expect(copy.cartBanner).toMatch(/2,999/);
    expect(copy.shippingPage).toMatch(/99/);
    expect(copy.announcement).toMatch(/over ₹2,999/);
  });
});

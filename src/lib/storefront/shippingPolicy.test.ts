import { describe, expect, it } from "vitest";
import {
  SHIPPING_POLICY,
  STOREFRONT_FREE_SHIPPING_THRESHOLD,
  storefrontShippingBannerText,
} from "@/lib/storefront/shippingPolicy";

describe("shippingPolicy", () => {
  it("uses free shipping on every order everywhere (no threshold copy)", () => {
    expect(STOREFRONT_FREE_SHIPPING_THRESHOLD).toBe(0);
    const copy = Object.values(SHIPPING_POLICY).join(" ");
    expect(copy).not.toMatch(/2,999|2999|above ₹|over ₹|qualifying/i);
    expect(copy).toMatch(/every order/i);
    expect(storefrontShippingBannerText()).toBe(SHIPPING_POLICY.cartBanner);
  });
});

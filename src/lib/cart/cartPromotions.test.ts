import { describe, expect, it } from "vitest";
import { getCartPromotionsConfig } from "@/lib/cart/cartPromotions";

describe("getCartPromotionsConfig", () => {
  it("reflects admin shipping settings in banner and threshold", () => {
    const config = getCartPromotionsConfig({
      freeShippingThreshold: 4999,
      standardShippingCharge: 149,
    });

    expect(config.freeShippingThreshold).toBe(4999);
    expect(config.bannerText).toMatch(/4,999/);
    expect(config.shippingCopy.cartFooter).toMatch(/4,999/);
  });

  it("defaults to free shipping on every order", () => {
    const config = getCartPromotionsConfig();
    expect(config.freeShippingThreshold).toBe(0);
    expect(config.shippingCopy.cartBanner).toMatch(/every order/i);
  });
});

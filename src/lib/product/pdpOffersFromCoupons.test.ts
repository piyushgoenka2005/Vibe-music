import { describe, expect, it } from "vitest";
import {
  buildPdpCouponPromoMessage,
  buildPdpOfferRowsFromCoupons,
} from "@/lib/product/pdpOffersFromCoupons";

describe("pdpOffersFromCoupons", () => {
  it("builds offer rows with coupon codes", () => {
    const rows = buildPdpOfferRowsFromCoupons([
      {
        code: "GUITAR10",
        label: "",
        type: "percentage",
        value: 10,
        scope: "products",
        productIds: ["p1"],
      },
    ]);

    expect(rows[0].id).toBe("GUITAR10");
    expect(rows[0].title).toContain("10%");
  });

  it("builds promo messages for each coupon type", () => {
    expect(
      buildPdpCouponPromoMessage({
        code: "P10",
        label: "",
        type: "percentage",
        value: 10,
      }),
    ).toMatch(/Save 10%/);

    expect(
      buildPdpCouponPromoMessage({
        code: "F500",
        label: "",
        type: "flat",
        value: 500,
      }),
    ).toMatch(/₹500/);

    expect(
      buildPdpCouponPromoMessage({
        code: "SHIP0",
        label: "",
        type: "free_shipping",
        value: 0,
      }),
    ).toMatch(/Free shipping/i);
  });
});

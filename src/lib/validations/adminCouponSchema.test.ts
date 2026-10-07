import { describe, expect, it } from "vitest";
import { adminCouponSchema } from "@/lib/validations/admin";

describe("adminCouponSchema", () => {
  it("accepts product-scoped percentage coupons", () => {
    const parsed = adminCouponSchema.parse({
      code: "GUITAR10",
      label: "Guitar 10%",
      type: "percentage",
      value: 10,
      scope: "products",
      productIds: ["p1"],
    });

    expect(parsed.scope).toBe("products");
  });

  it("accepts free shipping coupons without a positive value", () => {
    const parsed = adminCouponSchema.parse({
      code: "SHIP0",
      label: "Free shipping",
      type: "free_shipping",
      value: 0,
      scope: "products",
      productIds: ["p1"],
    });

    expect(parsed.type).toBe("free_shipping");
    expect(parsed.value).toBe(0);
  });

  it("rejects more than 10 product ids", () => {
    const result = adminCouponSchema.safeParse({
      code: "BULK10",
      label: "Bulk",
      type: "percentage",
      value: 10,
      scope: "products",
      productIds: Array.from({ length: 11 }, (_, i) => `p${i}`),
    });

    expect(result.success).toBe(false);
  });
});

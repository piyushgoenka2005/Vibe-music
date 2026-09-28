import { describe, expect, it } from "vitest";
import { resolveAuthoritativeShippingCharge } from "@/lib/server/shippingQuoteService";

describe("resolveAuthoritativeShippingCharge", () => {
  it("returns zero for storefront orders (free shipping policy)", async () => {
    const charge = await resolveAuthoritativeShippingCharge({
      method: "standard",
      subtotal: 5000,
      discount: 0,
      postalCode: "700001",
      state: "West Bengal",
    });
    expect(charge).toBe(0);
  });
});

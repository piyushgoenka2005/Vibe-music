import { describe, expect, it } from "vitest";
import { evaluatePriceChangeGuard } from "./priceChangePolicy";

describe("evaluatePriceChangeGuard", () => {
  it("allows modest price updates", () => {
    expect(
      evaluatePriceChangeGuard({
        sku: "VM-1",
        previousPrice: 10_000,
        nextPrice: 9_500,
        mrp: 12_000,
      }).allowed,
    ).toBe(true);
  });

  it("blocks extreme discounts", () => {
    const result = evaluatePriceChangeGuard({
      sku: "VM-1",
      previousPrice: 80_000,
      nextPrice: 37_000,
      mrp: 95_000,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.requiresApproval).toBe(true);
    }
  });

  it("can be bypassed for emergency ops", () => {
    expect(
      evaluatePriceChangeGuard(
        {
          sku: "VM-1",
          previousPrice: 80_000,
          nextPrice: 37_000,
          mrp: 95_000,
        },
        { allowLargeChanges: true },
      ).allowed,
    ).toBe(true);
  });
});

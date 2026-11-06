import { describe, it, expect } from "vitest";
import { formatCurrency, isPurchasablePrice } from "@/lib/shared/currency";

describe("Alias resolution check", () => {
  it("resolves @ alias and formats currency", () => {
    expect(isPurchasablePrice(100)).toBe(true);
    expect(formatCurrency(100)).toContain("100");
  });
});

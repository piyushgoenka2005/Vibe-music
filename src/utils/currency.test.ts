import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatCurrencyPrecise,
  isPurchasablePrice,
  formatDisplayPrice,
  usdToInr,
} from "./currency";

describe("formatCurrency", () => {
  it("formats zero as ₹0", () => {
    expect(formatCurrency(0)).toBe("₹0");
  });

  it("formats whole numbers without decimals", () => {
    expect(formatCurrency(1500)).toBe("₹1,500");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(123456)).toBe("₹1,23,456");
  });

  it("rounds to whole numbers by default", () => {
    expect(formatCurrency(999.99)).toBe("₹1,000");
  });

  it("respects custom options", () => {
    const result = formatCurrency(999.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    expect(result).toContain("999");
  });
});

describe("formatCurrencyPrecise", () => {
  it("formats with up to 2 decimal places", () => {
    expect(formatCurrencyPrecise(999)).toBe("₹999");
  });

  it("formats prices with paise", () => {
    const result = formatCurrencyPrecise(999.5);
    expect(result).toContain("999");
    expect(result).toContain("5");
  });
});

describe("isPurchasablePrice", () => {
  it("returns true for positive finite numbers", () => {
    expect(isPurchasablePrice(100)).toBe(true);
    expect(isPurchasablePrice(0.01)).toBe(true);
    expect(isPurchasablePrice(99999)).toBe(true);
  });

  it("returns false for zero", () => {
    expect(isPurchasablePrice(0)).toBe(false);
  });

  it("returns false for negative numbers", () => {
    expect(isPurchasablePrice(-10)).toBe(false);
  });

  it("returns false for NaN", () => {
    expect(isPurchasablePrice(NaN)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isPurchasablePrice(Infinity)).toBe(false);
  });
});

describe("formatDisplayPrice", () => {
  it("formats purchasable prices as currency", () => {
    expect(formatDisplayPrice(1500)).toBe("₹1,500");
  });

  it("shows Coming Soon for zero prices", () => {
    expect(formatDisplayPrice(0)).toBe("Coming Soon");
  });

  it("shows Coming Soon for negative prices", () => {
    expect(formatDisplayPrice(-100)).toBe("Coming Soon");
  });

  it("uses salePrice when provided and valid", () => {
    expect(formatDisplayPrice(1500, 999)).toBe("₹999");
  });

  it("falls back to regular price when salePrice is null", () => {
    expect(formatDisplayPrice(1500, null)).toBe("₹1,500");
  });

  it("shows Coming Soon when salePrice is invalid", () => {
    expect(formatDisplayPrice(1500, 0)).toBe("Coming Soon");
  });
});

describe("usdToInr", () => {
  it("converts $1 to approx ₹83", () => {
    expect(usdToInr(1)).toBe(83);
  });

  it("converts $100 to approx ₹8333", () => {
    expect(usdToInr(100)).toBe(8333);
  });

  it("rounds to nearest integer", () => {
    expect(usdToInr(1.5)).toBe(125);
  });

  it("handles zero", () => {
    expect(usdToInr(0)).toBe(0);
  });
});

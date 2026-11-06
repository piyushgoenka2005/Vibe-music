import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDisplayPrice,
  isPurchasablePrice,
  usdToInr,
} from "@/lib/shared/currency";
import { LOCALE } from "@/lib/locale";

describe("Tier 1: Currency & Locale Formatting & Selection", () => {
  it("formats standard INR currency with rupee symbol and thousands separator", () => {
    const formatted = formatCurrency(68500);
    // Should format with rupee symbol ₹ and proper separator
    expect(formatted).toMatch(/₹\s?68,500/);
  });

  it("formats precise currency with two decimal digits", () => {
    const formatted = formatCurrencyPrecise(1499.5);
    expect(formatted).toMatch(/₹\s?1,499\.5/);

    const twoDecimals = formatCurrencyPrecise(1499.75);
    expect(twoDecimals).toMatch(/₹\s?1,499\.75/);

    const wholeFormatted = formatCurrencyPrecise(5000);
    expect(wholeFormatted).toMatch(/₹\s?5,000/);
  });

  it("correctly identifies purchasable prices vs unpurchasable prices", () => {
    expect(isPurchasablePrice(100)).toBe(true);
    expect(isPurchasablePrice(0.01)).toBe(true);
    expect(isPurchasablePrice(68500)).toBe(true);

    // Unpurchasable
    expect(isPurchasablePrice(0)).toBe(false);
    expect(isPurchasablePrice(-50)).toBe(false);
    expect(isPurchasablePrice(NaN)).toBe(false);
    expect(isPurchasablePrice(Infinity)).toBe(false);
  });

  it("displays 'Coming Soon' for unpriced or zero-price products", () => {
    expect(formatDisplayPrice(0)).toBe("Coming Soon");
    expect(formatDisplayPrice(-100)).toBe("Coming Soon");
    expect(formatDisplayPrice(0, null)).toBe("Coming Soon");

    // Valid price
    expect(formatDisplayPrice(5000)).toMatch(/₹\s?5,000/);
    // Sale price overrides regular price
    expect(formatDisplayPrice(6000, 4500)).toMatch(/₹\s?4,500/);
  });

  it("converts USD to INR accurately based on exchange benchmark", () => {
    expect(usdToInr(100)).toBe(8333);
    expect(usdToInr(1000)).toBe(83330);
    expect(usdToInr(0)).toBe(0);
  });

  it("supports multi-currency formatting for international currencies", () => {
    const currencies = [
      { code: "USD", locale: "en-US", symbol: "$" },
      { code: "EUR", locale: "de-DE", symbol: "€" },
      { code: "GBP", locale: "en-GB", symbol: "£" },
      { code: "AED", locale: "ar-AE", symbol: "د.إ" },
    ];

    for (const curr of currencies) {
      const formatted = new Intl.NumberFormat(curr.locale, {
        style: "currency",
        currency: curr.code,
        maximumFractionDigits: 0,
      }).format(1000);

      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    }
  });

  it("default system locale conforms to Indian e-commerce standards", () => {
    expect(LOCALE.locale).toBe("en-IN");
    expect(LOCALE.currency).toBe("INR");
    expect(LOCALE.country).toBe("India");
    expect(LOCALE.timezone).toBe("Asia/Kolkata");
  });
});

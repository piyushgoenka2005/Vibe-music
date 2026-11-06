import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CurrencyLocaleSelector from "./CurrencyLocaleSelector";
import { ACTIVE_CURRENCIES, ACTIVE_LOCALES, useCurrencyLocaleStore } from "./currencyLocaleStore";

describe("CurrencyLocaleSelector & Store", () => {
  it("defines active currencies: INR, USD, EUR, GBP, AED", () => {
    const codes = ACTIVE_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("INR");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("AED");
  });

  it("defines active locales: en-IN and hi-IN", () => {
    const localeCodes = ACTIVE_LOCALES.map((l) => l.code);
    expect(localeCodes).toContain("en-IN");
    expect(localeCodes).toContain("hi-IN");
  });

  it("renders header variant with trigger button and ARIA dialog properties", () => {
    const html = renderToStaticMarkup(<CurrencyLocaleSelector variant="header" />);
    expect(html).toContain("vibe-currency-selector--header");
    expect(html).toContain("vibe-currency-selector__trigger");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("INR");
  });

  it("renders mobile drawer footer variant with accessible selects and touch targets", () => {
    const html = renderToStaticMarkup(<CurrencyLocaleSelector variant="mobile" />);
    expect(html).toContain("vibe-currency-selector--mobile");
    expect(html).toContain("vibe-currency-selector__mobile-select");
    expect(html).toContain("vibe-mobile-currency-select");
    expect(html).toContain("vibe-mobile-locale-select");
    expect(html).toContain("Region &amp; Language");
    expect(html).toContain("INR");
    expect(html).toContain("USD");
    expect(html).toContain("EUR");
    expect(html).toContain("GBP");
    expect(html).toContain("AED");
    expect(html).toContain("en-IN");
    expect(html).toContain("hi-IN");
  });

  it("updates currency and locale state via store actions", () => {
    const store = useCurrencyLocaleStore.getState();
    expect(store.currency).toBeDefined();

    store.setCurrency("USD");
    expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

    store.setCurrency("EUR");
    expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");

    store.setCurrency("INR");
    expect(useCurrencyLocaleStore.getState().currency).toBe("INR");

    store.setLocale("hi-IN");
    expect(useCurrencyLocaleStore.getState().locale).toBe("hi-IN");

    store.setLocale("en-IN");
    expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
  });
});

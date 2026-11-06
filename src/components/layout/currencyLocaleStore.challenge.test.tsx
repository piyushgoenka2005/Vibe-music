import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVE_CURRENCIES, ACTIVE_LOCALES, useCurrencyLocaleStore } from "./currencyLocaleStore";

describe("Currency & Locale Store — Adversarial Challenge Suite", () => {
  beforeEach(() => {
    // Reset store state
    useCurrencyLocaleStore.setState({
      currency: "INR",
      locale: "en-IN",
      isInitialized: false,
    });
    // Clear storage and cookies
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    if (typeof document !== "undefined") {
      document.cookie = "vibe_currency=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "vibe_locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  });

  describe("Extreme Boundary Cases: Rapid Consecutive Mutations", () => {
    it("survives 2,000 rapid consecutive currency mutations without race conditions or state corruption", () => {
      const store = useCurrencyLocaleStore.getState();
      const codes = ["USD", "EUR", "GBP", "AED", "INR"];

      for (let i = 0; i < 2000; i++) {
        const nextCode = codes[i % codes.length];
        store.setCurrency(nextCode);
      }

      // 2000 % 5 = 0, so last set was codes[1999 % 5] = codes[4] = "INR"
      expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
      if (typeof localStorage !== "undefined") {
        expect(localStorage.getItem("vibe_currency")).toBe("INR");
      }
    });

    it("survives rapid interleaved currency and locale mutations concurrently", () => {
      const store = useCurrencyLocaleStore.getState();
      const currencies = ["USD", "EUR", "GBP", "AED", "INR"];
      const locales = ["en-IN", "hi-IN"];

      for (let i = 0; i < 500; i++) {
        store.setCurrency(currencies[i % currencies.length]);
        store.setLocale(locales[i % locales.length]);
      }

      const finalState = useCurrencyLocaleStore.getState();
      expect(finalState.currency).toBe(currencies[499 % currencies.length]); // "INR"
      expect(finalState.locale).toBe(locales[499 % locales.length]); // "hi-IN"
    });

    it("dispatches custom DOM event with exact detail payload on each valid mutation", () => {
      if (typeof window === "undefined") return;

      const store = useCurrencyLocaleStore.getState();
      const currencyEvents: string[] = [];
      const localeEvents: string[] = [];

      const currencyListener = (e: Event) => {
        const custom = e as CustomEvent<{ currency: string }>;
        currencyEvents.push(custom.detail.currency);
      };

      const localeListener = (e: Event) => {
        const custom = e as CustomEvent<{ locale: string }>;
        localeEvents.push(custom.detail.locale);
      };

      window.addEventListener("vibe:currency-change", currencyListener);
      window.addEventListener("vibe:locale-change", localeListener);

      store.setCurrency("EUR");
      store.setCurrency("USD");
      store.setLocale("hi-IN");
      store.setLocale("en-IN");

      window.removeEventListener("vibe:currency-change", currencyListener);
      window.removeEventListener("vibe:locale-change", localeListener);

      expect(currencyEvents).toEqual(["EUR", "USD"]);
      expect(localeEvents).toEqual(["hi-IN", "en-IN"]);
    });

    it("rejects invalid, unknown, or malicious currencies without mutating store or dispatching events", () => {
      if (typeof window === "undefined") return;

      const store = useCurrencyLocaleStore.getState();
      store.setCurrency("INR");

      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const adversarialInputs = [
        "XYZ",
        "",
        "   ",
        "BTC",
        "USDT",
        "<script>alert('xss')</script>",
        "DROP TABLE currencies;",
        "123",
        "INVALID",
      ];

      for (const input of adversarialInputs) {
        store.setCurrency(input);
        expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
      }

      // dispatchEvent should not have been called for any invalid currency
      expect(dispatchSpy).not.toHaveBeenCalled();
      dispatchSpy.mockRestore();
    });

    it("handles lowercase valid currency codes safely by normalizing to uppercase", () => {
      const store = useCurrencyLocaleStore.getState();
      store.setCurrency("usd");
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      store.setCurrency("eur");
      expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");

      store.setCurrency("gbp");
      expect(useCurrencyLocaleStore.getState().currency).toBe("GBP");
    });
  });

  describe("Corrupted and Malicious localStorage & Cookie Resilience", () => {
    it("falls back to default INR when localStorage has corrupted/unknown values on init", () => {
      if (typeof localStorage === "undefined") return;

      const corruptedValues = [
        "UNKNOWN",
        "",
        "null",
        "undefined",
        "{}",
        "<script>alert(1)</script>",
        "usd", // lowercase in storage must not bypass validation
        "12345",
      ];

      for (const val of corruptedValues) {
        localStorage.setItem("vibe_currency", val);
        useCurrencyLocaleStore.setState({ currency: "INR", isInitialized: false });
        useCurrencyLocaleStore.getState().init();
        expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
      }
    });

    it("falls back to default en-IN when localStorage has corrupted/unknown locale on init", () => {
      if (typeof localStorage === "undefined") return;

      const corruptedLocales = [
        "fr-FR",
        "es-ES",
        "en-US",
        "de-DE",
        "",
        "EN-IN", // exact match required
        "<invalid>",
      ];

      for (const val of corruptedLocales) {
        localStorage.setItem("vibe_locale", val);
        useCurrencyLocaleStore.setState({ locale: "en-IN", isInitialized: false });
        useCurrencyLocaleStore.getState().init();
        expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
      }
    });

    it("recovers valid currency from document.cookie when localStorage is empty", () => {
      if (typeof document === "undefined" || typeof localStorage === "undefined") return;

      localStorage.removeItem("vibe_currency");
      document.cookie = "vibe_currency=USD; path=/;";

      useCurrencyLocaleStore.setState({ currency: "INR", isInitialized: false });
      useCurrencyLocaleStore.getState().init();

      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");
    });

    it("handles multi-cookie strings with whitespace and other keys cleanly", () => {
      if (typeof document === "undefined" || typeof localStorage === "undefined") return;

      localStorage.removeItem("vibe_currency");
      document.cookie = "session_token=xyz123; vibe_currency=GBP; theme=dark; path=/;";

      useCurrencyLocaleStore.setState({ currency: "INR", isInitialized: false });
      useCurrencyLocaleStore.getState().init();

      expect(useCurrencyLocaleStore.getState().currency).toBe("GBP");
    });

    it("ignores corrupted cookie values and defaults to INR", () => {
      if (typeof document === "undefined" || typeof localStorage === "undefined") return;

      localStorage.removeItem("vibe_currency");
      document.cookie = "vibe_currency=INVALID_CURRENCY; path=/;";

      useCurrencyLocaleStore.setState({ currency: "INR", isInitialized: false });
      useCurrencyLocaleStore.getState().init();

      expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
    });

    it("survives localStorage SecurityError (e.g., storage disabled in private browsing)", () => {
      if (typeof localStorage === "undefined") return;

      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });

      // init() must not throw
      expect(() => {
        useCurrencyLocaleStore.getState().init();
      }).not.toThrow();

      // setCurrency() must not throw
      expect(() => {
        useCurrencyLocaleStore.getState().setCurrency("USD");
      }).not.toThrow();
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      // setLocale() must not throw
      expect(() => {
        useCurrencyLocaleStore.getState().setLocale("hi-IN");
      }).not.toThrow();
      expect(useCurrencyLocaleStore.getState().locale).toBe("hi-IN");

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe("SSR / CSR Hydration Resilience", () => {
    it("guarantees initial SSR defaults match client initial store before init()", () => {
      // Prior to init(), store defaults to INR and en-IN
      const freshState = useCurrencyLocaleStore.getInitialState();
      expect(freshState.currency).toBe("INR");
      expect(freshState.locale).toBe("en-IN");
      expect(freshState.isInitialized).toBe(false);
    });

    it("maintains exchange rate invariants for all supported currencies", () => {
      expect(ACTIVE_CURRENCIES).toHaveLength(5);
      ACTIVE_CURRENCIES.forEach((c) => {
        expect(c.rate).toBeGreaterThan(0);
        expect(c.symbol).toBeTruthy();
        expect(c.flag).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.code.length).toBe(3);
      });

      // Base currency INR must have rate 1.0
      const inr = ACTIVE_CURRENCIES.find((c) => c.code === "INR");
      expect(inr?.rate).toBe(1.0);
    });

    it("verifies all active locales have shortLabels and nativeNames", () => {
      expect(ACTIVE_LOCALES).toHaveLength(2);
      ACTIVE_LOCALES.forEach((l) => {
        expect(l.code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
        expect(l.shortLabel).toBeTruthy();
        expect(l.nativeName).toBeTruthy();
        expect(l.name).toBeTruthy();
      });
    });

    it("safely recovers and renders selector even if store state is corrupted with invalid currency", async () => {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const CurrencyLocaleSelector = (await import("./CurrencyLocaleSelector")).default;

      // Forcefully corrupt store state
      useCurrencyLocaleStore.setState({
        currency: "MALFORMED_CURRENCY" as string,
        locale: "UNKNOWN_LOCALE" as string,
        isInitialized: true,
      });

      // Must not throw; must fallback gracefully to default first items
      expect(() => {
        const html = renderToStaticMarkup(<CurrencyLocaleSelector variant="header" />);
        expect(html).toContain("vibe-currency-selector--header");
        expect(html).toContain("INR");
        expect(html).toContain("EN");
      }).not.toThrow();
    });
  });
});

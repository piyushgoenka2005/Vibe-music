/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ACTIVE_CURRENCIES, ACTIVE_LOCALES, useCurrencyLocaleStore } from "./currencyLocaleStore";
import CurrencyLocaleSelector from "./CurrencyLocaleSelector";

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
}

describe("Currency & Locale Selector — Empirical Stress Harness", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockCookie = "";
  const eventListeners = new Map<string, Set<(e: any) => void>>();

  const setupClientEnvironment = () => {
    mockStorage = createMockStorage();
    mockCookie = "";
    eventListeners.clear();

    const mockWindow = {
      dispatchEvent: (event: { type: string; detail?: any }) => {
        const listeners = eventListeners.get(event.type);
        if (listeners) {
          listeners.forEach((fn) => fn(event));
        }
        return true;
      },
      addEventListener: (type: string, listener: any) => {
        if (!eventListeners.has(type)) {
          eventListeners.set(type, new Set());
        }
        eventListeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: any) => {
        eventListeners.get(type)?.delete(listener);
      },
    };

    const mockDoc = {
      get cookie() {
        return mockCookie;
      },
      set cookie(val: string) {
        const parts = val.split(";")[0].split("=");
        const key = parts[0]?.trim();
        const value = parts[1]?.trim() || "";
        const cookies = mockCookie
          ? mockCookie.split("; ").filter((c) => !c.startsWith(`${key}=`))
          : [];
        cookies.push(`${key}=${value}`);
        mockCookie = cookies.join("; ");
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: mockWindow,
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      writable: true,
      value: mockDoc,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: mockStorage,
    });
    Object.defineProperty(globalThis, "CustomEvent", {
      configurable: true,
      writable: true,
      value: class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, params: { detail?: any } = {}) {
          this.type = type;
          this.detail = params.detail;
        }
      },
    });
  };

  const teardownClientEnvironment = () => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).localStorage;
    delete (globalThis as any).CustomEvent;
  };

  beforeEach(() => {
    setupClientEnvironment();
    useCurrencyLocaleStore.setState({
      currency: "INR",
      locale: "en-IN",
      isInitialized: false,
    });
  });

  afterEach(() => {
    teardownClientEnvironment();
    vi.restoreAllMocks();
  });

  describe("1. Rapid Consecutive Currency & Locale Mutations", () => {
    it("handles 1,000 rapid sequential mutations without crashing or state desync", () => {
      const store = useCurrencyLocaleStore.getState();
      const validCurrencies = ACTIVE_CURRENCIES.map((c) => c.code);
      const validLocales = ACTIVE_LOCALES.map((l) => l.code);

      for (let i = 0; i < 1000; i++) {
        const nextCurr = validCurrencies[i % validCurrencies.length];
        const nextLoc = validLocales[i % validLocales.length];
        store.setCurrency(nextCurr);
        store.setLocale(nextLoc);

        const current = useCurrencyLocaleStore.getState();
        expect(current.currency).toBe(nextCurr);
        expect(current.locale).toBe(nextLoc);
      }

      // Verify final value persisted to storage and cookies
      expect(mockStorage.getItem("vibe_currency")).toBe(useCurrencyLocaleStore.getState().currency);
      expect(mockStorage.getItem("vibe_locale")).toBe(useCurrencyLocaleStore.getState().locale);
      expect(document.cookie).toContain(
        `vibe_currency=${useCurrencyLocaleStore.getState().currency}`,
      );
      expect(document.cookie).toContain(`vibe_locale=${useCurrencyLocaleStore.getState().locale}`);
    });

    it("normalizes lowercase and mixed-case currency inputs", () => {
      const store = useCurrencyLocaleStore.getState();
      store.setCurrency("usd");
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      store.setCurrency("Eur");
      expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");

      store.setCurrency("gbp");
      expect(useCurrencyLocaleStore.getState().currency).toBe("GBP");

      store.setCurrency("aed");
      expect(useCurrencyLocaleStore.getState().currency).toBe("AED");
    });

    it("rejects invalid, unknown, empty, or malicious currency codes without modifying state", () => {
      const store = useCurrencyLocaleStore.getState();
      store.setCurrency("USD");
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      const maliciousInputs = [
        "",
        " ",
        "XYZ",
        "BITCOIN",
        "<script>alert(1)</script>",
        "123",
        "NULL",
        "UNDEFINED",
        "INR; DROP TABLE users;--",
        "JPY",
      ];

      for (const input of maliciousInputs) {
        store.setCurrency(input);
        expect(useCurrencyLocaleStore.getState().currency).toBe("USD");
        expect(mockStorage.getItem("vibe_currency")).toBe("USD");
      }
    });

    it("rejects invalid or unknown locale codes without modifying current state", () => {
      const store = useCurrencyLocaleStore.getState();
      store.setLocale("en-IN");

      const invalidLocales = [
        "",
        "en-US",
        "fr-FR",
        "zh-CN",
        "null",
        "undefined",
        "hi-US",
        "../../etc/passwd",
      ];

      for (const input of invalidLocales) {
        store.setLocale(input);
        expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
        expect(mockStorage.getItem("vibe_locale")).toBe("en-IN");
      }
    });

    it("dispatches custom DOM events with correct payloads on window", () => {
      let currencyEventFired = false;
      let lastEventCurrency = "";
      let localeEventFired = false;
      let lastEventLocale = "";

      const onCurrencyChange = (e: any) => {
        currencyEventFired = true;
        lastEventCurrency = e.detail.currency;
      };
      const onLocaleChange = (e: any) => {
        localeEventFired = true;
        lastEventLocale = e.detail.locale;
      };

      window.addEventListener("vibe:currency-change", onCurrencyChange);
      window.addEventListener("vibe:locale-change", onLocaleChange);

      const store = useCurrencyLocaleStore.getState();
      store.setCurrency("EUR");
      expect(currencyEventFired).toBe(true);
      expect(lastEventCurrency).toBe("EUR");

      store.setLocale("hi-IN");
      expect(localeEventFired).toBe(true);
      expect(lastEventLocale).toBe("hi-IN");
    });
  });

  describe("2. Empty, Corrupted, and Hostile localStorage / Cookie States", () => {
    it("gracefully falls back to default 'INR' and 'en-IN' on corrupted localStorage", () => {
      const corruptedValues = [
        "",
        "null",
        "undefined",
        "{corrupted json",
        "FORGED_CURRENCY",
        "12345",
        "NaN",
      ];

      for (const corrupt of corruptedValues) {
        mockStorage.setItem("vibe_currency", corrupt);
        mockStorage.setItem("vibe_locale", corrupt);

        useCurrencyLocaleStore.getState().init();
        const state = useCurrencyLocaleStore.getState();
        expect(state.currency).toBe("INR");
        expect(state.locale).toBe("en-IN");
      }
    });

    it("handles storage throwing exceptions (e.g. QuotaExceededError or private browsing) safely", () => {
      const hostileStorage = {
        getItem: () => {
          throw new Error("QuotaExceeded or SecurityError");
        },
        setItem: () => {
          throw new Error("QuotaExceeded or SecurityError");
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      };

      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: hostileStorage,
      });

      // init() and setters must not throw
      expect(() => useCurrencyLocaleStore.getState().init()).not.toThrow();
      expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
      expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");

      expect(() => useCurrencyLocaleStore.getState().setCurrency("USD")).not.toThrow();
      expect(useCurrencyLocaleStore.getState().currency).toBe("USD");

      expect(() => useCurrencyLocaleStore.getState().setLocale("hi-IN")).not.toThrow();
      expect(useCurrencyLocaleStore.getState().locale).toBe("hi-IN");
    });

    it("parses cookies correctly even with complex or malformed cookie headers", () => {
      mockStorage.clear();
      mockCookie =
        "other_session=abc123xyz; vibe_currency=GBP; unescaped=%20; vibe_locale=hi-IN; test=1";

      useCurrencyLocaleStore.getState().init();
      const state = useCurrencyLocaleStore.getState();
      expect(state.currency).toBe("GBP");
      expect(state.locale).toBe("hi-IN");
    });
  });

  describe("3. SSR & Hydration Resilience", () => {
    it("renders server-side markup cleanly with static fallbacks", () => {
      teardownClientEnvironment();

      const htmlHeader = renderToStaticMarkup(<CurrencyLocaleSelector variant="header" />);
      expect(htmlHeader).toContain("vibe-currency-selector--header");
      expect(htmlHeader).toContain("INR");
      expect(htmlHeader).toContain("EN");

      const htmlMobile = renderToStaticMarkup(<CurrencyLocaleSelector variant="mobile" />);
      expect(htmlMobile).toContain("vibe-currency-selector--mobile");
      expect(htmlMobile).toContain('value="INR"');
      expect(htmlMobile).toContain('value="en-IN"');
    });

    it("falls back to ACTIVE_CURRENCIES[0] even if store currency is set to an unrecognized value", () => {
      useCurrencyLocaleStore.setState({
        currency: "NONEXISTENT",
        locale: "NONEXISTENT",
      });

      const htmlHeader = renderToStaticMarkup(<CurrencyLocaleSelector variant="header" />);
      expect(htmlHeader).toContain("₹");
      expect(htmlHeader).toContain("INR");
    });
  });
});

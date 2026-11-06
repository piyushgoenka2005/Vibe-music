/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { ACTIVE_CURRENCIES, ACTIVE_LOCALES, useCurrencyLocaleStore } from "./currencyLocaleStore";

describe("Adversarial Probes: Currency & Locale Persistence", () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;
  let mockStorage: Record<string, string> = {};
  let mockCookies: string[] = [];
  let dispatchedEvents: Array<{ type: string; detail: any }> = [];

  beforeEach(() => {
    mockStorage = {};
    mockCookies = [];
    dispatchedEvents = [];

    // Reset Zustand store state
    useCurrencyLocaleStore.setState({
      currency: "INR",
      locale: "en-IN",
      isInitialized: false,
    });

    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    // Mock document.cookie
    let cookieStore = "";
    const mockDocument = {
      get cookie() {
        return cookieStore;
      },
      set cookie(val: string) {
        mockCookies.push(val);
        // Extract key=value
        const match = val.match(/^([^=;]+)=([^;]*)/);
        if (match) {
          const key = match[1].trim();
          const value = match[2];
          // update simple cookie store
          const pairs = cookieStore.split("; ").filter((p) => p && !p.startsWith(`${key}=`));
          pairs.push(`${key}=${value}`);
          cookieStore = pairs.join("; ");
        }
      },
    };

    // Mock window dispatchEvent & CustomEvent
    class MockCustomEvent {
      type: string;
      detail: any;
      constructor(type: string, options?: { detail?: any }) {
        this.type = type;
        this.detail = options?.detail;
      }
    }

    const mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn((event: any) => {
        dispatchedEvents.push({ type: event.type, detail: event.detail });
        return true;
      }),
    };

    // Attach to globalThis
    (globalThis as any).window = mockWindow;
    (globalThis as any).document = mockDocument;
    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis as any).CustomEvent = MockCustomEvent;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).localStorage;
    delete (globalThis as any).CustomEvent;
  });

  it("probes cookie attributes: verifies SameSite=Lax, max-age=31536000, and path=/", () => {
    const store = useCurrencyLocaleStore.getState();
    store.setCurrency("USD");

    // Check raw cookie header set on document.cookie
    const lastCookie = mockCookies[mockCookies.length - 1];
    expect(lastCookie).toBeDefined();
    expect(lastCookie).toContain("vibe_currency=USD");
    expect(lastCookie).toContain("path=/");
    expect(lastCookie).toContain("max-age=31536000");
    expect(lastCookie).toContain("SameSite=Lax");
  });

  it("probes event dispatching: verifies CustomEvent 'vibe:currency-change' with normalized payload", () => {
    const store = useCurrencyLocaleStore.getState();
    store.setCurrency("eur"); // Lowercase input

    expect(dispatchedEvents.length).toBe(1);
    expect(dispatchedEvents[0].type).toBe("vibe:currency-change");
    expect(dispatchedEvents[0].detail).toEqual({ currency: "EUR" });
    expect(useCurrencyLocaleStore.getState().currency).toBe("EUR");
  });

  it("probes locale cookie attributes and 'vibe:locale-change' event dispatching", () => {
    const store = useCurrencyLocaleStore.getState();
    store.setLocale("hi-IN");

    const lastCookie = mockCookies[mockCookies.length - 1];
    expect(lastCookie).toContain("vibe_locale=hi-IN");
    expect(lastCookie).toContain("path=/");
    expect(lastCookie).toContain("max-age=31536000");
    expect(lastCookie).toContain("SameSite=Lax");

    expect(dispatchedEvents.length).toBe(1);
    expect(dispatchedEvents[0].type).toBe("vibe:locale-change");
    expect(dispatchedEvents[0].detail).toEqual({ locale: "hi-IN" });
  });

  it("strictly rejects invalid, bogus, or injection currency codes and keeps current state", () => {
    const store = useCurrencyLocaleStore.getState();
    store.setCurrency("INR"); // Baseline valid

    const initialCookieCount = mockCookies.length;
    const initialEventCount = dispatchedEvents.length;

    // Attempt invalid currency codes
    const invalidCodes = [
      "XYZ",
      "BTC",
      "FAKE",
      "USD; document.cookie='evil=true'",
      "<script>alert(1)</script>",
      "",
      " ",
      "123",
      "US",
    ];

    for (const code of invalidCodes) {
      store.setCurrency(code);
      // State must not change
      expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
    }

    // No new cookies or events should have been dispatched
    expect(mockCookies.length).toBe(initialCookieCount);
    expect(dispatchedEvents.length).toBe(initialEventCount);
  });

  it("strictly rejects invalid locale codes and keeps current state", () => {
    const store = useCurrencyLocaleStore.getState();
    store.setLocale("en-IN");

    const invalidLocales = ["fr-FR", "es-ES", "zh-CN", "en-US", "hi", "invalid"];
    for (const loc of invalidLocales) {
      store.setLocale(loc);
      expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
    }
  });

  it("defaults safely to INR if localStorage contains corrupt or unsupported currency", () => {
    mockStorage["vibe_currency"] = "BITCOIN_CORRUPT";

    const store = useCurrencyLocaleStore.getState();
    store.init();

    expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
  });

  it("defaults safely to INR if document.cookie contains corrupt or tampered currency", () => {
    (globalThis as any).document.cookie = "vibe_currency=TAMPERED_CURRENCY; other=val";

    const store = useCurrencyLocaleStore.getState();
    store.init();

    expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
  });

  it("safely initializes valid currency from document.cookie when localStorage is empty", () => {
    (globalThis as any).document.cookie = "vibe_currency=GBP; user_id=123";

    const store = useCurrencyLocaleStore.getState();
    store.init();

    expect(useCurrencyLocaleStore.getState().currency).toBe("GBP");
  });

  it("survives localStorage QuotaExceeded or SecurityError without throwing", () => {
    // Simulate private browsing mode where localStorage.setItem throws
    (globalThis as any).localStorage.setItem = vi.fn(() => {
      throw new Error("QuotaExceededError: Dom storage quota exceeded");
    });

    const store = useCurrencyLocaleStore.getState();
    expect(() => store.setCurrency("AED")).not.toThrow();
    // In-memory state still successfully updates
    expect(useCurrencyLocaleStore.getState().currency).toBe("AED");
  });

  it("survives SSR environment (typeof window === 'undefined') gracefully", () => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;

    const store = useCurrencyLocaleStore.getState();
    // init during SSR
    expect(() => store.init()).not.toThrow();
    expect(useCurrencyLocaleStore.getState().currency).toBe("INR");
    expect(useCurrencyLocaleStore.getState().locale).toBe("en-IN");
  });
});

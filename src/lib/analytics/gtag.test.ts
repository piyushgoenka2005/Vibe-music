import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_CONSENT_KEY } from "@/lib/analytics/config";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("trackPageView consent gating (L-29)", () => {
  const gtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("document", { title: "Vibe Music" });
    vi.stubGlobal("window", {
      dataLayer: [] as unknown[],
      localStorage: createStorage(),
      location: { href: "https://vibemusic.in/cart" },
      gtag,
    });
    gtag.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("does not emit page_view before analytics consent is granted", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTMEASURE");
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "unknown");

    const { trackPageView } = await import("@/lib/analytics/gtag");
    trackPageView("/cart");

    expect(gtag).not.toHaveBeenCalled();
  });

  it("emits page_view after consent is granted", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TESTMEASURE");
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");

    const { trackPageView } = await import("@/lib/analytics/gtag");
    trackPageView("/cart");

    expect(gtag).toHaveBeenCalled();
  });
});

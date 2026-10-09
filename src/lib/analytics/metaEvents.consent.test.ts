import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_CONSENT_KEY } from "@/lib/analytics/config";

describe("Meta Pixel consent helpers", () => {
  const fbq = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "2368094903963199");
    vi.stubGlobal("window", { fbq });
    fbq.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("grants Meta consent when analytics is not yet marked granted in storage", async () => {
    vi.resetModules();
    const { grantMetaConsent } = await import("@/lib/analytics/metaEvents");
    grantMetaConsent();
    expect(fbq).toHaveBeenCalledWith("consent", "grant");
  });

  it("revokes Meta consent after user declines analytics", async () => {
    vi.resetModules();
    const storage = new Map<string, string>();
    storage.set(ANALYTICS_CONSENT_KEY, "denied");
    vi.stubGlobal("window", {
      fbq,
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    const { revokeMetaConsent } = await import("@/lib/analytics/metaEvents");
    revokeMetaConsent();
    expect(fbq).toHaveBeenCalledWith("consent", "revoke");
  });
});

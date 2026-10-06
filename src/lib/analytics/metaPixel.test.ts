import { afterEach, describe, expect, it, vi } from "vitest";

describe("metaPixel config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts numeric Meta Pixel IDs", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "415660111827152");
    const { getMetaPixelId, isMetaPixelConfigured } = await import("@/lib/analytics/metaPixel");
    expect(getMetaPixelId()).toBe("415660111827152");
    expect(isMetaPixelConfigured()).toBe(true);
  });

  it("rejects invalid pixel IDs", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "not-a-pixel");
    const { getMetaPixelId, isMetaPixelConfigured } = await import("@/lib/analytics/metaPixel");
    expect(getMetaPixelId()).toBeUndefined();
    expect(isMetaPixelConfigured()).toBe(false);
  });

  it("reads domain verification from server env", async () => {
    vi.stubEnv("META_DOMAIN_VERIFICATION", "abc123domaintoken");
    const { getMetaDomainVerification } = await import("@/lib/analytics/metaPixel");
    expect(getMetaDomainVerification()).toBe("abc123domaintoken");
  });

  it("builds official Meta Pixel base code with init and PageView", async () => {
    const { buildMetaPixelInlineScript } = await import("@/lib/analytics/metaPixel");
    const script = buildMetaPixelInlineScript("2368094903963199");
    expect(script).toContain("fbevents.js");
    expect(script).toContain("fbq('init', '2368094903963199')");
    expect(script).toContain("fbq('track', 'PageView')");
  });
});

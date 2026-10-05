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
});

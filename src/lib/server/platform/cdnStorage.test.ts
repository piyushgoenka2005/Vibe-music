import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("cdnStorage dev defaults", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses project-local storage on Windows when configured with VPS path", async () => {
    process.env.NODE_ENV = "development";
    process.env.CDN_STORAGE_ROOT = "/var/www/cdn";
    process.env.CDN_PUBLIC_BASE_URL = "https://cdn.vibemusic.in";

    if (process.platform === "linux") {
      return;
    }

    const { getCdnStorageRoot, getCdnPublicBaseUrl, getProjectLocalCdnRoot } =
      await import("./cdnStorage");

    expect(getCdnStorageRoot()).toBe(getProjectLocalCdnRoot());
    expect(getCdnPublicBaseUrl()).toBe("http://localhost:3000/cdn-local");
  });

  it("keeps production CDN paths in production runtime", async () => {
    process.env.NODE_ENV = "production";
    process.env.CDN_STORAGE_ROOT = "/var/www/cdn";
    process.env.CDN_PUBLIC_BASE_URL = "https://cdn.vibemusic.in";

    const { getCdnStorageRoot, getCdnPublicBaseUrl } = await import("./cdnStorage");

    expect(getCdnStorageRoot()).toBe("/var/www/cdn");
    expect(getCdnPublicBaseUrl()).toBe("https://cdn.vibemusic.in");
  });

  it("recognizes local dev CDN URLs for delete helpers", async () => {
    process.env.NODE_ENV = "development";
    process.env.CDN_PUBLIC_BASE_URL = "http://localhost:3000/cdn-local";

    const { isCdnUrl } = await import("./cdnStorage");

    expect(isCdnUrl("http://localhost:3000/cdn-local/products/guitars/demo/uuid-w960.webp")).toBe(
      true,
    );
  });
});

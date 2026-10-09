import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMetadataBaseUrl } from "./publicSiteUrl";

describe("resolveMetadataBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses localhost in development when env points at production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vibemusic.in");
    vi.stubEnv("PORT", "3000");
    expect(resolveMetadataBaseUrl()).toBe("http://localhost:3000");
  });

  it("keeps production URL in production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://vibemusic.in");
    expect(resolveMetadataBaseUrl()).toBe("https://vibemusic.in");
  });
});

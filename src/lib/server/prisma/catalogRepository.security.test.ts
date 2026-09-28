import { afterEach, describe, expect, it, vi } from "vitest";
import { isJsonCatalogFallbackAllowed } from "@/lib/server/prisma/catalogRepository";

describe("isJsonCatalogFallbackAllowed", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllEnvs();
  });

  it("forbids JSON fallback in production unless explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ALLOW_JSON_CATALOG_FALLBACK;
    expect(isJsonCatalogFallbackAllowed()).toBe(false);
  });

  it("allows JSON fallback in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.ALLOW_JSON_CATALOG_FALLBACK;
    expect(isJsonCatalogFallbackAllowed()).toBe(true);
  });

  it("honours explicit ALLOW_JSON_CATALOG_FALLBACK=false", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.ALLOW_JSON_CATALOG_FALLBACK = "false";
    expect(isJsonCatalogFallbackAllowed()).toBe(false);
  });
});

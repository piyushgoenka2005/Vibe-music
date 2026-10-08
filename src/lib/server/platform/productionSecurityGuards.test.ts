import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProductionSecurityControls,
  auditProductionSecurityControls,
} from "@/lib/server/productionSecurityGuards";

describe("productionSecurityGuards", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllEnvs();
  });

  it("reports all controls secure in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ALLOW_DEMO_PAYMENTS;
    delete process.env.E2E_TEST_MODE;
    delete process.env.ALLOW_JSON_CATALOG_FALLBACK;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const audit = auditProductionSecurityControls();
    expect(audit.demoPaymentsBlocked).toBe(true);
    expect(audit.e2eResetCaptureDisabled).toBe(true);
    expect(audit.jsonCatalogFallbackBlocked).toBe(true);
    expect(audit.distributedRateLimitConfigured).toBe(true);
    expect(audit.guestOrderBulkLinkDisabled).toBe(true);
    expect(audit.issues).toEqual([]);
  });

  it("flags demo payments when enabled in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.ALLOW_DEMO_PAYMENTS = "true";

    const audit = auditProductionSecurityControls();
    expect(audit.issues).toContain("ALLOW_DEMO_PAYMENTS must not be enabled in production");
    expect(() => assertProductionSecurityControls()).toThrow(/ALLOW_DEMO_PAYMENTS/);
  });

  it("flags E2E capture mode in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ALLOW_DEMO_PAYMENTS;
    process.env.E2E_TEST_MODE = "true";

    const audit = auditProductionSecurityControls();
    expect(audit.issues).toContain("E2E_TEST_MODE must not be enabled in production");
  });

  it("flags JSON catalog fallback in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ALLOW_DEMO_PAYMENTS;
    delete process.env.E2E_TEST_MODE;
    process.env.ALLOW_JSON_CATALOG_FALLBACK = "true";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const audit = auditProductionSecurityControls();
    expect(audit.issues).toContain("ALLOW_JSON_CATALOG_FALLBACK must not be enabled in production");
  });

  it("flags missing Upstash credentials in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ALLOW_DEMO_PAYMENTS;
    delete process.env.E2E_TEST_MODE;
    delete process.env.ALLOW_JSON_CATALOG_FALLBACK;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const audit = auditProductionSecurityControls();
    expect(audit.issues).toContain(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production for distributed rate limiting",
    );
    expect(() => assertProductionSecurityControls()).toThrow(/UPSTASH_REDIS_REST_URL/);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("validateEnv production security", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllEnvs();
  });

  async function loadValidateEnv() {
    const mod = await import("@/env");
    mod.resetEnvValidationForTests();
    return mod.validateEnv;
  }

  function setMinimalProductionEnv(): void {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_SITE_URL = "https://vibemusic.in";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/vibe";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_live_test_key_id_12345";
    process.env.RAZORPAY_KEY_ID = "rzp_live_test_key_id_12345";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec";
    process.env.GUEST_ORDER_ACCESS_SECRET = "g".repeat(32);
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    delete process.env.ALLOW_DEMO_PAYMENTS;
    delete process.env.E2E_TEST_MODE;
    delete process.env.ALLOW_JSON_CATALOG_FALLBACK;
  }

  it("rejects E2E_TEST_MODE in production", async () => {
    setMinimalProductionEnv();
    process.env.E2E_TEST_MODE = "true";
    const validateEnv = await loadValidateEnv();
    expect(() => validateEnv()).toThrow(/E2E_TEST_MODE/);
  });

  it("rejects ALLOW_JSON_CATALOG_FALLBACK in production", async () => {
    setMinimalProductionEnv();
    process.env.ALLOW_JSON_CATALOG_FALLBACK = "true";
    const validateEnv = await loadValidateEnv();
    expect(() => validateEnv()).toThrow(/ALLOW_JSON_CATALOG_FALLBACK/);
  });
});

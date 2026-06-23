import { describe, expect, it, afterEach } from "vitest";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";

describe("getIntegrationChecks", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("reports missing upstash and razorpay webhook when unset", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const checks = getIntegrationChecks();
    expect(checks.upstash).toBe("missing");
    expect(checks.razorpayWebhook).toBe("missing");
  });

  it("reports ok when upstash and webhook secrets are configured", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";

    const checks = getIntegrationChecks();
    expect(checks.upstash).toBe("ok");
    expect(checks.razorpayWebhook).toBe("ok");
  });
});

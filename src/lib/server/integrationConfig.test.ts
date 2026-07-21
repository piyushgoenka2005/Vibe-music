import { describe, expect, it, afterEach } from "vitest";
import {
  getIntegrationChecks,
  getOpsStatusReport,
} from "@/lib/server/integrationConfig";

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

  it("marks invoice PDF as partial when only one flag is set", () => {
    delete process.env.INVOICE_PDF_ENABLED;
    process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED = "true";

    const checks = getIntegrationChecks();
    expect(checks.invoicePdf).toBe("partial");
  });

  it("exposes a non-secret ops status report for admin", () => {
    const report = getOpsStatusReport();
    expect(report.items.length).toBeGreaterThan(5);
    expect(report.items.every((item) => item.label && item.detail)).toBe(true);
    expect(report.items.some((item) => item.key === "places")).toBe(true);
    expect(report.items.some((item) => item.key === "googleOAuth")).toBe(true);
    expect(report.items.some((item) => item.key === "analyticsClient")).toBe(true);
  });
});

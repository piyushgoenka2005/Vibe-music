import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createInvoiceAccessToken,
  verifyInvoiceAccessToken,
} from "@/lib/security/invoiceAccessToken";
import {
  getShippingChargeForMethod,
  isShippingMethod,
} from "@/lib/shipping/shippingMethods";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";

describe("invoiceAccessToken", () => {
  const originalSecret = process.env.INVOICE_ACCESS_SECRET;

  beforeEach(() => {
    process.env.INVOICE_ACCESS_SECRET = "test-secret-key-for-invoice";
  });

  afterEach(() => {
    process.env.INVOICE_ACCESS_SECRET = originalSecret;
  });

  it("creates and verifies a guest invoice token", () => {
    const token = createInvoiceAccessToken("order-1", "guest@example.com");
    expect(token).toBeTruthy();
    expect(
      verifyInvoiceAccessToken(token!, "order-1", "guest@example.com")
    ).toBe(true);
  });

  it("rejects tampered tokens", () => {
    const token = createInvoiceAccessToken("order-1", "guest@example.com");
    expect(verifyInvoiceAccessToken(`${token}x`, "order-1")).toBe(false);
  });
});

describe("shippingMethods", () => {
  it("validates shipping method ids", () => {
    expect(isShippingMethod("standard")).toBe(true);
    expect(isShippingMethod("invalid")).toBe(false);
  });

  it("applies free standard shipping above threshold", () => {
    expect(getShippingChargeForMethod("standard", 10000, 0)).toBe(0);
    expect(getShippingChargeForMethod("express", 10000, 0)).toBe(199);
  });
});

describe("distributedCheckRateLimit", () => {
  it("falls back to in-memory limiting without Upstash env", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const key = `test-${Date.now()}`;
    const options = { limit: 2, windowMs: 60_000 };

    const first = await distributedCheckRateLimit(key, options);
    const second = await distributedCheckRateLimit(key, options);
    const third = await distributedCheckRateLimit(key, options);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});

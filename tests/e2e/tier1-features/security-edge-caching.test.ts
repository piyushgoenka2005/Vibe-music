import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { SECURITY_HEADERS } from "@/lib/security/headers";
import { DEFAULT_RATE_LIMITS } from "@/lib/security/rate-limit-config";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/signature";

describe("Tier 1: Next.js Edge Proxy, Security Headers & Caching (Features 26, 27, 28)", () => {
  it("enforces strict production security headers (Feature 26)", () => {
    const headerMap = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));

    // HSTS (HTTP Strict Transport Security) max-age >= 1 year with preload
    const hsts = headerMap.get("Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");

    // Clickjacking defense
    expect(headerMap.get("X-Frame-Options")).toBe("SAMEORIGIN");

    // MIME sniffing defense
    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");

    // Referrer policy
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // Content Security Policy
    const csp = headerMap.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it("defines isolated rate-limiting buckets and burst thresholds (Feature 26)", () => {
    // Sensitive endpoints have tight rate limit buckets
    expect(DEFAULT_RATE_LIMITS.auth.limit).toBeLessThanOrEqual(40);
    expect(DEFAULT_RATE_LIMITS.checkout.limit).toBeLessThanOrEqual(60);
    expect(DEFAULT_RATE_LIMITS.search.limit).toBeLessThanOrEqual(90);

    // Public API and thumbs have higher capacity
    expect(DEFAULT_RATE_LIMITS.publicApi.limit).toBeGreaterThanOrEqual(100);
    expect(DEFAULT_RATE_LIMITS.mediaThumb.limit).toBeGreaterThanOrEqual(500);

    // Bulk import has long 5-minute window
    expect(DEFAULT_RATE_LIMITS.adminBulkImport.windowMs).toBe(300_000);
  });

  it("verifies webhook idempotency and HMAC SHA256 cryptographic verification (Feature 28)", () => {
    const secret = "whsec_live_prod_webhook_key_998877";

    const payload = JSON.stringify({
      entity: "event",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: "pay_Kk0192AaBbCc",
            order_id: "order_Kj9a82LxP101",
            amount: 6850000,
            status: "captured",
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    });

    const validSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    // Correct HMAC signature accepted
    expect(verifyRazorpayWebhookSignature(payload, validSignature, secret)).toBe(true);

    // Modified payload rejected
    const tamperedPayload = payload.replace("6850000", "1000000");
    expect(verifyRazorpayWebhookSignature(tamperedPayload, validSignature, secret)).toBe(false);

    // Bad signature rejected
    expect(verifyRazorpayWebhookSignature(payload, "invalid_signature", secret)).toBe(false);
  });
});

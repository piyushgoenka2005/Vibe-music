import { test, expect } from "./fixtures";
import { mutationHeaders } from "./helpers/test-utils";

test.describe("Phase 2 security hardening (L-16/L-17/L-18)", () => {
  test("API responses include nosniff and rate-limit headers (L-17)", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBeLessThan(500);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-ratelimit-remaining"]).toBeTruthy();
    expect(headers["x-ratelimit-reset"]).toBeTruthy();
  });

  test("forgot-password returns ok for unknown email without oracle (L-18)", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/forgot-password", {
      headers: mutationHeaders(),
      data: { email: `no-such-user-${Date.now()}@example.com` },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { ok?: boolean; error?: string };
    expect(body.ok).toBe(true);
    expect(body.error).toBeUndefined();
  });

  test("debug payment route is not exposed in production builds", async ({ request }) => {
    const response = await request.get("/api/debug/payment");
    // Dev server may return diagnostics; production must 404.
    if (process.env.NODE_ENV === "production") {
      expect(response.status()).toBe(404);
    } else {
      expect([200, 404, 500]).toContain(response.status());
    }
  });

  test("e2e password-reset capture is disabled outside E2E mode", async ({ request }) => {
    const response = await request.get("/api/e2e/password-reset");
    if (process.env.E2E_TEST_MODE === "true") {
      expect([200, 404]).toContain(response.status());
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test("mutations without Origin/Referer are rejected with 403 (L-16 CSRF)", async ({
    request,
  }) => {
    const response = await request.post("/api/cart/reprice", {
      headers: { "Content-Type": "application/json" },
      data: { items: [] },
    });
    expect(response.status()).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/origin|csrf|forbidden/i);
  });

  test("Razorpay webhook rejects missing signature (L-21)", async ({ request }) => {
    const response = await request.post("/api/payment/webhook/razorpay", {
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Event-Id": `evt_e2e_${Date.now()}`,
      },
      data: { event: "payment.captured", payload: {} },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toMatch(/signature/i);
  });
});

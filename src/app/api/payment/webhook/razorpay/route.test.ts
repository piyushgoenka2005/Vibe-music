import crypto from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  distributedCheckRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60_000,
  })),
}));

vi.mock("@/lib/razorpay/signature", () => ({
  getRazorpayWebhookSecret: vi.fn(() => "test_webhook_secret"),
  verifyRazorpayWebhookSignature: vi.fn(),
}));

vi.mock("@/lib/server/razorpayWebhookService", () => ({
  processRazorpayWebhook: vi.fn(async () => ({
    eventId: "evt_1",
    eventType: "payment.captured",
    orderId: "ord_1",
    skipped: false,
    message: "processed",
  })),
}));

import { POST } from "@/app/api/payment/webhook/razorpay/route";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay/signature";
import { processRazorpayWebhook } from "@/lib/server/razorpayWebhookService";

const SECRET = "test_webhook_secret";

function signWebhook(body: string): string {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

function webhookRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/payment/webhook/razorpay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Event-Id": "evt_test_1",
      ...headers,
    },
    body,
  });
}

describe("POST /api/payment/webhook/razorpay (L-21)", () => {
  beforeEach(() => {
    vi.mocked(verifyRazorpayWebhookSignature).mockReset();
    vi.mocked(processRazorpayWebhook).mockClear();
  });

  it("returns 400 when signature header is missing", async () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const res = await POST(webhookRequest(body));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toMatch(/signature/i);
  });

  it("returns 400 when signature is invalid", async () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    vi.mocked(verifyRazorpayWebhookSignature).mockReturnValue(false);
    const res = await POST(webhookRequest(body, { "X-Razorpay-Signature": "bad-signature" }));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toMatch(/invalid webhook signature/i);
    expect(processRazorpayWebhook).not.toHaveBeenCalled();
  });

  it("processes a valid signed webhook", async () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_1" } } },
    });
    const signature = signWebhook(body);
    vi.mocked(verifyRazorpayWebhookSignature).mockReturnValue(true);

    const res = await POST(webhookRequest(body, { "X-Razorpay-Signature": signature }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok?: boolean; eventId?: string };
    expect(json.ok).toBe(true);
    expect(json.eventId).toBe("evt_1");
    expect(processRazorpayWebhook).toHaveBeenCalledWith({
      eventId: "evt_test_1",
      eventType: "payment.captured",
      payload: { payment: { entity: { id: "pay_1" } } },
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/server/orderService", () => ({
  verifyAndCompletePayment: vi.fn(),
  attachPaidOrderToUser: vi.fn(),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
  };
});

vi.mock("@/lib/security/mutation-origin", () => ({
  isMutationMethod: vi.fn().mockReturnValue(true),
  isWebhookPath: vi.fn().mockReturnValue(false),
  verifyMutationOrigin: vi.fn().mockReturnValue(true),
}));

import { POST } from "./route";
import {
  verifyAndCompletePayment,
  attachPaidOrderToUser,
} from "@/lib/server/orderService";
import { getSessionUser } from "@/lib/auth/server-session";
import { enforceRateLimit } from "@/lib/api/route-utils";

const VALID_PAYMENT_BODY = {
  orderId: "order_123",
  razorpayOrderId: "order_123",
  razorpayPaymentId: "pay_123",
  razorpaySignature: "sig_123",
};

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/payment/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payment/verify-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceRateLimit).mockResolvedValue(null);
    (getSessionUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user1",
      email: "test@example.com",
      uid: "uid1",
    });
    (verifyAndCompletePayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "order_123",
      email: "test@example.com",
      status: "paid",
    });
    (attachPaidOrderToUser as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("verifies payment successfully", async () => {
    const mockResult = { id: "order_123", email: "test@example.com", status: "paid" };
    (verifyAndCompletePayment as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

    const res = await POST(makePostRequest(VALID_PAYMENT_BODY));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.orderId).toBe("order_123");
  });

  it("returns 429 when rate limited", async () => {
    (enforceRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await POST(makePostRequest(VALID_PAYMENT_BODY));
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing fields", async () => {
    const res = await POST(
      makePostRequest({ orderId: "order_123" })
    );
    expect(res.status).toBe(400);
  });

  it("handles service errors gracefully", async () => {
    (verifyAndCompletePayment as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Payment verification failed")
    );

    const res = await POST(makePostRequest(VALID_PAYMENT_BODY));
    // formatCheckoutError returns safe messages, status depends on content
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThanOrEqual(500);
  });
});

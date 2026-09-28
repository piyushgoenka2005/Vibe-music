import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/orderService", () => ({
  getOrderById: vi.fn(),
  attachPaidOrderToUser: vi.fn(),
}));

vi.mock("@/lib/server/orderPaymentService", () => ({
  completeOrderPayment: vi.fn(),
}));

vi.mock("@/lib/server/env", () => ({
  isDemoPaymentsAllowed: vi.fn(),
  isRazorpayConfigured: vi.fn(),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
  };
});

import { POST } from "./route";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";

describe("POST /api/payment/demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when demo payments are disabled", async () => {
    vi.mocked(isDemoPaymentsAllowed).mockReturnValue(false);
    vi.mocked(isRazorpayConfigured).mockReturnValue(false);

    const res = await POST(
      new Request("http://localhost/api/payment/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord_1" }),
      }),
    );

    expect(res.status).toBe(403);
  });

  it("returns 403 when Razorpay is configured even if demo flag is on", async () => {
    vi.mocked(isDemoPaymentsAllowed).mockReturnValue(true);
    vi.mocked(isRazorpayConfigured).mockReturnValue(true);

    const res = await POST(
      new Request("http://localhost/api/payment/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord_1" }),
      }),
    );

    expect(res.status).toBe(403);
  });
});

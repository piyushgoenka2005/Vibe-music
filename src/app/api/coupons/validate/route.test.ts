import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/route-utils", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
  handleRouteError: vi.fn((error: unknown) => {
    throw error;
  }),
  parseJsonBody: vi.fn(async (_request, schema) => {
    const body = {
      code: "GUITAR10",
      subtotal: 5000,
      items: [{ productId: "p1", quantity: 1, price: 5000 }],
      customerEmail: "buyer@test.com",
    };
    return { data: schema.parse(body) };
  }),
}));

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn().mockResolvedValue({ uid: "user-1", email: "buyer@test.com" }),
}));

vi.mock("@/lib/server/couponService", () => ({
  validateCoupon: vi.fn(),
}));

import { POST } from "@/app/api/coupons/validate/route";
import { validateCoupon } from "@/lib/server/couponService";

describe("POST /api/coupons/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes session and email context to coupon validation", async () => {
    vi.mocked(validateCoupon).mockResolvedValue({
      valid: true,
      discount: 500,
      coupon: {
        code: "GUITAR10",
        label: "Guitar 10%",
        type: "percentage",
        value: 10,
        scope: "products",
        productIds: ["p1"],
      },
    });

    const request = new Request("http://localhost/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(validateCoupon).toHaveBeenCalledWith(
      "GUITAR10",
      5000,
      [{ productId: "p1", quantity: 1, price: 5000 }],
      { userId: "user-1", customerEmail: "buyer@test.com" },
    );
    expect(payload.result.valid).toBe(true);
  });
});

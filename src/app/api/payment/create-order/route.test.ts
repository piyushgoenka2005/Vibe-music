import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/orderService", () => ({
  createOrder: vi.fn(),
}));

vi.mock("@/lib/server/orderValidation", () => ({
  resolveOrderItems: vi.fn(),
  resolveCouponDiscount: vi.fn(),
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
import { createOrder } from "@/lib/server/orderService";
import { resolveCouponDiscount, resolveOrderItems } from "@/lib/server/orderValidation";

const shippingAddress = {
  name: "Buyer",
  line1: "1 Test St",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "IN",
};

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/payment/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payment/create-order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveOrderItems).mockResolvedValue([
      {
        productId: "prod-l15-test",
        name: "L15 Test Guitar",
        quantity: 1,
        price: 15000,
        gstRate: 18,
      },
    ]);
    vi.mocked(resolveCouponDiscount).mockResolvedValue(0);
    vi.mocked(createOrder).mockResolvedValue({
      order: {
        id: "VM-TEST-1",
        total: 17700,
        trackingToken: "tok",
      } as Awaited<ReturnType<typeof createOrder>>["order"],
      razorpayOrderId: "order_rzp",
      keyId: "rzp_test",
    });
  });

  it("rejects client-supplied price fields on line items", async () => {
    const res = await POST(
      makePostRequest({
        items: [
          {
            productId: "prod-l15-test",
            quantity: 1,
            price: 1,
            gstRate: 5,
          },
        ],
        email: "buyer@example.com",
        paymentMethod: "razorpay",
        shippingAddress,
      }),
    );

    expect(res.status).toBe(400);
    expect(resolveOrderItems).not.toHaveBeenCalled();
  });

  it("creates orders from catalog-resolved prices only", async () => {
    const res = await POST(
      makePostRequest({
        items: [{ productId: "prod-l15-test", quantity: 1 }],
        email: "buyer@example.com",
        paymentMethod: "razorpay",
        shippingAddress,
      }),
    );

    expect(res.status).toBe(200);
    expect(resolveOrderItems).toHaveBeenCalledWith([{ productId: "prod-l15-test", quantity: 1 }]);
    expect(resolveCouponDiscount).toHaveBeenCalled();
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productId: "prod-l15-test",
            price: 15000,
          }),
        ],
        couponDiscount: 0,
      }),
      undefined,
    );

    const body = await res.json();
    expect(body.amount).toBe(1770000);
  });

  it("rejects client-supplied couponDiscount totals", async () => {
    const res = await POST(
      makePostRequest({
        items: [{ productId: "prod-l15-test", quantity: 1 }],
        email: "buyer@example.com",
        paymentMethod: "razorpay",
        couponCode: "SAVE50",
        couponDiscount: 99999,
        shippingAddress,
      }),
    );

    expect(res.status).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });
});

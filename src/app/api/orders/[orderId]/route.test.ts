import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/adminService", () => ({
  getAdminSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/orderService", () => ({
  getOrderById: vi.fn(),
}));

vi.mock("@/lib/server/shipmentService", () => ({
  buildPublicOrderTracking: vi.fn().mockResolvedValue({ order: {}, shipment: null }),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
  };
});

import { getSessionUser } from "@/lib/auth/server-session";
import { getOrderById } from "@/lib/server/orderService";
import { GET } from "./route";

function makeOrder(id: string, userId?: string): Order {
  return {
    id,
    email: "owner@example.com",
    userId,
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    subtotal: 100,
    couponDiscount: 0,
    shippingCharge: 0,
    platformFee: 0,
    totalGst: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 100,
    items: [],
    shippingAddress: {
      name: "Owner",
      line1: "1 Test St",
      city: "Kolkata",
      state: "WB",
      postalCode: "700001",
      country: "IN",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("GET /api/orders/[orderId] (L-19 IDOR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns order for the owning authenticated user", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_a",
      email: "owner@example.com",
      name: "Owner",
    });
    vi.mocked(getOrderById).mockResolvedValue(makeOrder("ord_1", "user_a"));

    const res = await GET(new Request("http://localhost/api/orders/ord_1"), {
      params: Promise.resolve({ orderId: "ord_1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.id).toBe("ord_1");
  });

  it("returns 404 when another authenticated user requests the order", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      uid: "user_b",
      email: "attacker@example.com",
      name: "Attacker",
    });
    vi.mocked(getOrderById).mockResolvedValue(makeOrder("ord_1", "user_a"));

    const res = await GET(new Request("http://localhost/api/orders/ord_1"), {
      params: Promise.resolve({ orderId: "ord_1" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 401 for unauthenticated access without guest token", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    vi.mocked(getOrderById).mockResolvedValue(makeOrder("ord_1", "user_a"));

    const res = await GET(new Request("http://localhost/api/orders/ord_1"), {
      params: Promise.resolve({ orderId: "ord_1" }),
    });

    expect(res.status).toBe(401);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

vi.mock("@/lib/db/prisma", () => ({
  isPostgresConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/server/prisma/orderRepository", () => ({
  listOrdersForUser: vi.fn(),
  listOrdersByEmail: vi.fn(),
}));

import * as pg from "@/lib/server/prisma/orderRepository";
import { listOrdersForUser } from "@/lib/server/orderRepository";

function makeOrder(id: string, userId?: string): Order {
  return {
    id,
    email: "buyer@example.com",
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
      name: "Buyer",
      line1: "1 Test St",
      city: "Kolkata",
      state: "WB",
      postalCode: "700001",
      country: "IN",
    },
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("listOrdersForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only orders linked to the authenticated user id", async () => {
    vi.mocked(pg.listOrdersForUser).mockResolvedValue([makeOrder("ord_owned", "user_a")]);
    vi.mocked(pg.listOrdersByEmail).mockResolvedValue([makeOrder("ord_guest_email", undefined)]);

    const orders = await listOrdersForUser("user_a");

    expect(orders.map((order) => order.id)).toEqual(["ord_owned"]);
    expect(pg.listOrdersByEmail).not.toHaveBeenCalled();
  });

  it("returns an empty list when no user id is provided", async () => {
    const orders = await listOrdersForUser();
    expect(orders).toEqual([]);
    expect(pg.listOrdersForUser).not.toHaveBeenCalled();
  });
});

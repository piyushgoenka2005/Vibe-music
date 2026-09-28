import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

vi.mock("@/lib/server/orderRepository", () => ({
  findOrderByRazorpayOrderId: vi.fn(),
  findOrderByRazorpayPaymentId: vi.fn(),
  lockOrderInTx: vi.fn(),
  updateOrderInTx: vi.fn(),
}));

import {
  findOrderByRazorpayOrderId,
  findOrderByRazorpayPaymentId,
} from "@/lib/server/orderPaymentService";
import * as orderRepository from "@/lib/server/orderRepository";

function makeOrder(id: string): Order {
  return {
    id,
    email: "buyer@example.com",
    status: "pending",
    paymentStatus: "pending",
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("orderPaymentService lookups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findOrderByRazorpayOrderId returns wrapped order", async () => {
    vi.mocked(orderRepository.findOrderByRazorpayOrderId).mockResolvedValue(makeOrder("ord_1"));
    const match = await findOrderByRazorpayOrderId("rzp_order_1");
    expect(match?.id).toBe("ord_1");
    expect(match?.data.id).toBe("ord_1");
  });

  it("findOrderByRazorpayPaymentId returns null when missing", async () => {
    vi.mocked(orderRepository.findOrderByRazorpayPaymentId).mockResolvedValue(null);
    const match = await findOrderByRazorpayPaymentId("pay_missing");
    expect(match).toBeNull();
  });
});

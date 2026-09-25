import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/prisma/orderRepository", () => ({
  findPurchasedProductOrders: vi.fn(),
}));

import * as pgOrder from "@/lib/server/prisma/orderRepository";
import { hasPurchasedProduct } from "@/lib/server/orderVerificationService";

describe("hasPurchasedProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks purchase history by user id only", async () => {
    vi.mocked(pgOrder.findPurchasedProductOrders).mockResolvedValue([
      {
        id: "ord_1",
        email: "buyer@example.com",
        userId: "user_a",
        status: "delivered",
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
        items: [
          {
            productId: "prod_1",
            variantId: "var_1",
            quantity: 1,
            price: 100,
            name: "Test product",
            gstRate: 18,
          },
        ],
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
      },
    ]);

    const result = await hasPurchasedProduct("user_a", "prod_1");

    expect(pgOrder.findPurchasedProductOrders).toHaveBeenCalledWith("user_a", "prod_1");
    expect(result).toEqual({ verified: true, orderId: "ord_1" });
  });
});

import { describe, expect, it } from "vitest";
import type { Order } from "@/types/order";
import {
  OrderCancellationError,
  isCustomerCancellable,
} from "@/lib/server/orderCancellationService";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord_test_1",
    userId: null,
    email: "guest@example.com",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    subtotal: 1000,
    total: 1180,
    items: [],
    shippingAddress: {} as Order["shippingAddress"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Order;
}

describe("isCustomerCancellable", () => {
  it("allows pending and confirmed orders", () => {
    expect(isCustomerCancellable(makeOrder({ status: "pending" }))).toBe(true);
    expect(isCustomerCancellable(makeOrder({ status: "confirmed" }))).toBe(true);
  });

  it("blocks processing/shipped/delivered/cancelled/refunded orders", () => {
    for (const status of [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ] as const) {
      expect(isCustomerCancellable(makeOrder({ status }))).toBe(false);
    }
  });
});

describe("OrderCancellationError", () => {
  it("carries an http status", () => {
    expect(new OrderCancellationError("nope", 403).status).toBe(403);
    expect(new OrderCancellationError("nope").status).toBe(400);
  });
});

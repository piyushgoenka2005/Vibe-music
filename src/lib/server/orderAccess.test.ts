import { afterEach, describe, expect, it, vi } from "vitest";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { isLegacyOrderTrackingDevFallbackEnabled } from "@/lib/server/orderTrackingToken";
import type { Order } from "@/types/order";

vi.mock("@/lib/server/orderTrackingToken", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/server/orderTrackingToken")>();
  return {
    ...actual,
    isLegacyOrderTrackingDevFallbackEnabled: vi.fn(() => false),
  };
});

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord_1",
    email: "buyer@example.com",
    userId: undefined,
    trackingToken: "11111111-1111-4111-8111-111111111111",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("canAccessOrder", () => {
  afterEach(() => {
    vi.mocked(isLegacyOrderTrackingDevFallbackEnabled).mockReturnValue(false);
  });

  it("allows the linked account owner", () => {
    const order = makeOrder({ userId: "user_a" });
    expect(canAccessOrder(order, { userId: "user_a" })).toBe(true);
    expect(canAccessOrder(order, { userId: "user_b" })).toBe(false);
  });

  it("allows a valid tracking token", () => {
    const order = makeOrder();
    expect(
      canAccessOrder(order, {
        trackingToken: "11111111-1111-4111-8111-111111111111",
      })
    ).toBe(true);
    expect(canAccessOrder(order, { trackingToken: "wrong-token" })).toBe(false);
  });

  it("denies email-only access when a different account is logged in (prod)", () => {
    vi.mocked(isLegacyOrderTrackingDevFallbackEnabled).mockReturnValue(false);
    const order = makeOrder({ userId: undefined });
    expect(
      canAccessOrder(order, {
        userId: "attacker",
        email: "buyer@example.com",
      })
    ).toBe(false);
  });

  it("allows email-only access only when legacy fallback is enabled", () => {
    vi.mocked(isLegacyOrderTrackingDevFallbackEnabled).mockReturnValue(true);
    const order = makeOrder({ userId: undefined });
    expect(
      canAccessOrder(order, {
        email: "buyer@example.com",
      })
    ).toBe(true);
  });
});

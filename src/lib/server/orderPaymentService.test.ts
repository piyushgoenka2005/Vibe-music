import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: object) => Promise<unknown>) => fn({})),
  },
}));

vi.mock("@/lib/server/orderRepository", () => ({
  findOrderByRazorpayOrderId: vi.fn(),
  findOrderByRazorpayPaymentId: vi.fn(),
  lockOrderInTx: vi.fn(),
  updateOrderInTx: vi.fn(),
}));

vi.mock("@/lib/server/inventoryService", () => ({
  fulfillReservedStockForOrderInTx: vi.fn(),
  reserveAndFulfillStockForOrderInTx: vi.fn(),
  releaseOrderInventoryInTx: vi.fn(),
  notifyWaitlistForReleasedOrder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/couponService", () => ({
  incrementCouponUsage: vi.fn(),
}));

vi.mock("@/lib/server/orderNotificationService", () => ({
  notifyAdminNewOrder: vi.fn(),
  notifyOrderRefunded: vi.fn(),
}));

vi.mock("@/lib/server/notifications", () => ({
  dispatchLifecycleNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics/measurementProtocol", () => ({
  sendServerPurchaseEvent: vi.fn(),
  sendServerRefundEvent: vi.fn(),
}));

vi.mock("@/lib/analytics/metaCapi", () => ({
  sendServerMetaPurchaseEvent: vi.fn(),
}));

import {
  completeOrderPayment,
  failOrderPayment,
  findOrderByRazorpayOrderId,
  findOrderByRazorpayPaymentId,
} from "@/lib/server/orderPaymentService";
import * as orderRepository from "@/lib/server/orderRepository";
import * as inventoryService from "@/lib/server/inventoryService";

function makeOrder(id: string, overrides: Partial<Order> = {}): Order {
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
    items: [
      {
        productId: "prod_1",
        name: "Test Guitar",
        quantity: 1,
        price: 100,
        gstRate: 18,
      },
    ],
    shippingAddress: {
      name: "Buyer",
      line1: "1 Test St",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "IN",
    },
    inventoryStatus: "reserved",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
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

describe("orderPaymentService transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completeOrderPayment skips when already paid with invoice", async () => {
    const paid = makeOrder("ord_paid", {
      paymentStatus: "paid",
      invoice: { invoiceNumber: "INV-1001" } as Order["invoice"],
    });
    vi.mocked(orderRepository.lockOrderInTx).mockResolvedValue(paid);

    const result = await completeOrderPayment({
      orderId: "ord_paid",
      razorpayPaymentId: "pay_1",
      source: "webhook",
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("already_paid");
    expect(inventoryService.fulfillReservedStockForOrderInTx).not.toHaveBeenCalled();
  });

  it("completeOrderPayment fulfills reserved inventory on capture", async () => {
    const pending = makeOrder("ord_new");
    const paid = makeOrder("ord_new", {
      paymentStatus: "paid",
      status: "confirmed",
      inventoryStatus: "fulfilled",
    });
    vi.mocked(orderRepository.lockOrderInTx).mockResolvedValue(pending);
    vi.mocked(orderRepository.updateOrderInTx).mockResolvedValue(paid);

    const result = await completeOrderPayment({
      orderId: "ord_new",
      razorpayPaymentId: "pay_new",
      razorpayOrderId: "rzp_order_new",
      source: "webhook",
    });

    expect(result.skipped).toBe(false);
    expect(inventoryService.fulfillReservedStockForOrderInTx).toHaveBeenCalled();
    expect(result.order.paymentStatus).toBe("paid");
  });

  it("failOrderPayment skips when order is already paid", async () => {
    const paid = makeOrder("ord_paid", { paymentStatus: "paid" });
    vi.mocked(orderRepository.lockOrderInTx).mockResolvedValue(paid);

    const result = await failOrderPayment({
      orderId: "ord_paid",
      reason: "user_cancelled",
    });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("already_paid");
    expect(inventoryService.releaseOrderInventoryInTx).not.toHaveBeenCalled();
  });

  it("failOrderPayment releases inventory on payment failure", async () => {
    const pending = makeOrder("ord_fail");
    const failed = makeOrder("ord_fail", {
      paymentStatus: "failed",
      status: "cancelled",
      inventoryStatus: "released",
    });
    vi.mocked(orderRepository.lockOrderInTx).mockResolvedValue(pending);
    vi.mocked(orderRepository.updateOrderInTx).mockResolvedValue(failed);

    const result = await failOrderPayment({
      orderId: "ord_fail",
      razorpayPaymentId: "pay_fail",
      reason: "payment_failed",
    });

    expect(result.skipped).toBe(false);
    expect(inventoryService.releaseOrderInventoryInTx).toHaveBeenCalled();
    expect(result.order.paymentStatus).toBe("failed");
  });
});

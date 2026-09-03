import { describe, it, expect, vi, beforeEach } from "vitest";
import { listAllOrders, updateOrderStatus, addOrderNote } from "@/lib/server/adminOrderService";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import { releaseOrderInventory } from "@/lib/server/inventoryService";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  notifyOrderStatusChanged,
  notifyOrderRefunded,
} from "@/lib/server/orderNotificationService";
import type { Order } from "@/types/order";

vi.mock("@/lib/server/prisma/orderRepository", () => ({
  listOrdersPaginated: vi.fn(),
  fetchOrderById: vi.fn(),
  patchOrderFields: vi.fn(),
}));

vi.mock("@/lib/server/inventoryService", () => ({
  releaseOrderInventory: vi.fn(),
}));

vi.mock("@/lib/server/auditLog", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/server/orderNotificationService", () => ({
  notifyOrderStatusChanged: vi.fn(),
  notifyOrderRefunded: vi.fn(),
}));

describe("adminOrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAllOrders", () => {
    it("returns paginated orders and filters by search query", async () => {
      const orders: Order[] = [
        {
          id: "ORD-12345",
          email: "customer1@example.com",
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          subtotal: 1000,
          total: 1180,
          items: [],
          shippingAddress: {
            fullName: "John Doe",
            name: "John Doe",
            phone: "9876543210",
            addressLine1: "123 Main St",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
          },
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "ORD-99999",
          email: "customer2@example.com",
          status: "delivered",
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          subtotal: 2000,
          total: 2360,
          items: [],
          shippingAddress: {
            fullName: "Jane Smith",
            name: "Jane Smith",
            phone: "9876543211",
            addressLine1: "456 Park Ave",
            city: "Delhi",
            state: "Delhi",
            postalCode: "110001",
          },
          createdAt: "2026-01-02T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        },
      ];

      vi.mocked(pgOrder.listOrdersPaginated).mockResolvedValue({
        orders,
        hasMore: false,
        nextCursor: undefined,
      });

      const res = await listAllOrders({ search: "Jane" });
      expect(res.orders).toHaveLength(1);
      expect(res.orders[0].id).toBe("ORD-99999");
    });
  });

  describe("updateOrderStatus", () => {
    const mockOrder: Order = {
      id: "ORD-55555",
      email: "test@example.com",
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      subtotal: 5000,
      total: 5900,
      items: [],
      shippingAddress: {
        fullName: "Aarav Patel",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
      },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    it("throws error if order is not found", async () => {
      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(null);

      await expect(updateOrderStatus("ORD-00000", "delivered", "admin@vibe.com")).rejects.toThrow(
        "Order not found",
      );
    });

    it("releases inventory when order is cancelled", async () => {
      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(mockOrder);
      vi.mocked(pgOrder.patchOrderFields).mockResolvedValue({
        ...mockOrder,
        status: "cancelled",
      });

      await updateOrderStatus(
        "ORD-55555",
        "cancelled",
        "admin@vibe.com",
        "Customer requested cancellation",
      );

      expect(releaseOrderInventory).toHaveBeenCalledWith(mockOrder);
      expect(pgOrder.patchOrderFields).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "order.note",
          resourceId: "ORD-55555",
        }),
      );
      expect(notifyOrderStatusChanged).toHaveBeenCalled();
    });

    it("releases inventory and notifies refund when order is refunded", async () => {
      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(mockOrder);
      vi.mocked(pgOrder.patchOrderFields).mockResolvedValue({
        ...mockOrder,
        status: "refunded",
        paymentStatus: "refunded",
      });

      await updateOrderStatus("ORD-55555", "refunded", "admin@vibe.com", "Defective unit return");

      expect(releaseOrderInventory).toHaveBeenCalledWith(mockOrder);
      expect(notifyOrderRefunded).toHaveBeenCalled();
    });
  });

  describe("addOrderNote", () => {
    it("adds a note to the order timeline and records audit log", async () => {
      const mockOrder: Order = {
        id: "ORD-11111",
        email: "user@example.com",
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        subtotal: 1000,
        total: 1180,
        items: [],
        shippingAddress: {
          fullName: "User",
          phone: "9876543210",
          addressLine1: "Apt 1",
          city: "Pune",
          state: "Maharashtra",
          postalCode: "411001",
        },
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      };

      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(mockOrder);

      await addOrderNote("ORD-11111", "Special packing requested", "admin@vibe.com");

      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "order.note",
          resourceId: "ORD-11111",
        }),
      );
    });
  });
});

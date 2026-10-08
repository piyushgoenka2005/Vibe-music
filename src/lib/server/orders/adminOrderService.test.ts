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

function buildOrder(overrides: Partial<Order> = {}): Order {
  const base: Order = {
    id: "ORD-00000",
    email: "unknown@example.com",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    subtotal: 1000,
    couponCode: null,
    couponDiscount: 0,
    shippingCharge: 100,
    platformFee: 0,
    totalGst: 180,
    cgst: 90,
    sgst: 90,
    igst: 0,
    total: 1280,
    items: [],
    shippingAddress: {
      name: "John Doe",
      line1: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "IN",
      phone: "9876543210",
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
  return { ...base, ...overrides };
}

describe("adminOrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Mirrors the real repository: filtering/search happens at the data layer,
   * so listAllOrders forwards options and returns whatever page the repo gives.
   */
  function mockListOrdersPaginated(orders: Order[]) {
    vi.mocked(pgOrder.listOrdersPaginated).mockImplementation(
      async (
        options: {
          status?: string;
          search?: string;
          limit?: number;
          offset?: number;
          cursor?: string;
        } = {},
      ) => {
        const limit = options.limit ?? 20;
        const query = options.search?.trim().toLowerCase();
        let list = orders;
        if (options.status) {
          list = list.filter((order) => order.status === options.status);
        }
        if (query) {
          list = list.filter(
            (order) =>
              order.id.toLowerCase().includes(query) ||
              order.email.toLowerCase().includes(query) ||
              (order.shippingAddress?.name ?? "").toLowerCase().includes(query),
          );
        }
        let start = 0;
        if (options.cursor) {
          const index = list.findIndex((order) => order.id === options.cursor);
          if (index >= 0) start = index + 1;
        } else if (options.offset && options.offset > 0) {
          start = options.offset;
        }
        const page = list.slice(start, start + limit + 1);
        const hasMore = page.length > limit;
        const items = page.slice(0, limit);
        return {
          orders: items,
          hasMore,
          nextCursor: hasMore ? items[items.length - 1]!.id : undefined,
        };
      },
    );
  }

  describe("listAllOrders", () => {
    it("returns paginated orders and filters by search query", async () => {
      const orders: Order[] = [
        buildOrder({
          id: "ORD-12345",
          email: "customer1@example.com",
          status: "confirmed",
        }),
        buildOrder({
          id: "ORD-99999",
          email: "customer2@example.com",
          status: "delivered",
          shippingAddress: {
            name: "Jane Smith",
            line1: "456 Park Ave",
            city: "Delhi",
            state: "Delhi",
            postalCode: "110001",
            country: "IN",
            phone: "9876543211",
          },
        }),
      ];
      mockListOrdersPaginated(orders);

      const res = await listAllOrders({ search: "Jane" });
      expect(res.orders).toHaveLength(1);
      expect(res.orders[0]!.id).toBe("ORD-99999");
      // Search must be forwarded to the repository (applied in Postgres).
      expect(pgOrder.listOrdersPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Jane" }),
      );
    });

    it("matches orders by id and email", async () => {
      const orders: Order[] = [
        buildOrder({ id: "ORD-12345", email: "customer1@example.com" }),
        buildOrder({
          id: "ORD-99999",
          email: "jane@example.com",
          status: "delivered",
        }),
      ];
      mockListOrdersPaginated(orders);

      const byId = await listAllOrders({ search: "ORD-12345" });
      expect(byId.orders).toHaveLength(1);
      expect(byId.orders[0]!.id).toBe("ORD-12345");

      const byEmail = await listAllOrders({ search: "jane@example.com" });
      expect(byEmail.orders).toHaveLength(1);
      expect(byEmail.orders[0]!.id).toBe("ORD-99999");
    });

    it("paginates with a cursor and reports hasMore", async () => {
      const orders: Order[] = Array.from({ length: 25 }, (_, index) =>
        buildOrder({
          id: `ORD-${String(index + 1).padStart(5, "0")}`,
          email: `user${index}@example.com`,
        }),
      );
      mockListOrdersPaginated(orders);

      const first = await listAllOrders({ limit: 10 });
      expect(first.orders).toHaveLength(10);
      expect(first.hasMore).toBe(true);
      expect(first.nextCursor).toBeDefined();

      const second = await listAllOrders({ limit: 10, cursor: first.nextCursor });
      expect(second.orders).toHaveLength(10);
      expect(second.hasMore).toBe(true);
      expect(second.orders[0]!.id).not.toBe(first.orders[first.orders.length - 1]!.id);
    });
  });

  describe("updateOrderStatus", () => {
    const mockOrder = buildOrder({
      id: "ORD-55555",
      email: "test@example.com",
      status: "processing",
      shippingAddress: {
        name: "Aarav Patel",
        line1: "Road 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "IN",
        phone: "9876543210",
      },
    });

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

    it("does not notify or release inventory when status is unchanged", async () => {
      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(mockOrder);
      vi.mocked(pgOrder.patchOrderFields).mockResolvedValue(mockOrder);

      await updateOrderStatus("ORD-55555", "processing", "admin@vibe.com");

      expect(releaseOrderInventory).not.toHaveBeenCalled();
      expect(notifyOrderStatusChanged).not.toHaveBeenCalled();
      expect(notifyOrderRefunded).not.toHaveBeenCalled();
    });
  });

  describe("addOrderNote", () => {
    it("adds a note to the order timeline and records audit log", async () => {
      const mockOrder = buildOrder({
        id: "ORD-11111",
        email: "user@example.com",
      });

      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(mockOrder);

      await addOrderNote("ORD-11111", "Special packing requested", "admin@vibe.com");

      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "order.note",
          resourceId: "ORD-11111",
        }),
      );
    });

    it("throws error if order is not found", async () => {
      vi.mocked(pgOrder.fetchOrderById).mockResolvedValue(null);

      await expect(addOrderNote("ORD-00000", "note", "admin@vibe.com")).rejects.toThrow(
        "Order not found",
      );
    });
  });
});

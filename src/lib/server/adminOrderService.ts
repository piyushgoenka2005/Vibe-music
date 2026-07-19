import { logAuditEvent } from "@/lib/server/auditLog";
import { releaseOrderInventory } from "@/lib/server/inventoryService";
import {
  notifyOrderRefunded,
  notifyOrderStatusChanged,
} from "@/lib/server/orderNotificationService";
import * as pgOrder from "@/lib/server/prisma/orderRepository";
import * as pgUsers from "@/lib/server/prisma/usersRepository";
import type { Order, OrderStatus } from "@/types/order";

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  note?: string;
  actor: string;
  createdAt: string;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginatedCustomersResult {
  customers: Array<{
    uid: string;
    email: string;
    displayName: string;
    isActive: boolean;
    orderCount: number;
    totalSpent: number;
    createdAt: string;
  }>;
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

function matchesOrderSearch(order: Order, query: string): boolean {
  const q = query.toLowerCase();
  return (
    order.id.toLowerCase().includes(q) ||
    order.email.toLowerCase().includes(q) ||
    (order.shippingAddress?.name?.toLowerCase().includes(q) ?? false)
  );
}

export async function listAllOrders(
  options: {
    status?: OrderStatus;
    search?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {}
): Promise<PaginatedOrdersResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const page = await pgOrder.listOrdersPaginated({
    status: options.status,
    limit,
    cursor: options.cursor,
    offset: options.offset,
  });

  let orders = page.orders;
  if (options.search) {
    orders = orders.filter((order) => matchesOrderSearch(order, options.search!));
  }

  return {
    orders,
    hasMore: options.search ? orders.length >= limit : page.hasMore,
    nextCursor: page.nextCursor,
    total: !options.cursor && !options.search ? undefined : undefined,
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: string,
  note?: string
): Promise<Order> {
  const existingOrder = await pgOrder.fetchOrderById(orderId);
  if (!existingOrder) throw new Error("Order not found");

  if (status === "cancelled" && existingOrder.status !== "cancelled") {
    await releaseOrderInventory(existingOrder);
  }

  if (status === "refunded" && existingOrder.status !== "refunded") {
    await releaseOrderInventory(existingOrder);
  }

  const now = new Date().toISOString();
  const patch: Partial<Order> = {
    status,
    updatedAt: now,
  };

  if (status === "refunded" && existingOrder.paymentStatus !== "refunded") {
    patch.paymentStatus = "refunded";
    patch.refundedAt = now;
    patch.inventoryStatus = "released";
  }

  const order = await pgOrder.patchOrderFields(orderId, patch);

  if (note?.trim()) {
    void logAuditEvent({
      action: "order.note",
      actorEmail: actor,
      resourceType: "order",
      resourceId: orderId,
      metadata: {
        note: note.trim(),
        status,
        previousStatus: existingOrder.status,
      },
    });
  }

  if (status !== existingOrder.status) {
    if (status === "refunded") {
      void notifyOrderRefunded(order);
    } else {
      void notifyOrderStatusChanged(order, existingOrder.status);
    }
  }

  return order;
}

export async function addOrderNote(
  orderId: string,
  note: string,
  actor: string
): Promise<void> {
  const existingOrder = await pgOrder.fetchOrderById(orderId);
  if (!existingOrder) throw new Error("Order not found");

  await logAuditEvent({
    action: "order.note",
    actorEmail: actor,
    resourceType: "order",
    resourceId: orderId,
    metadata: {
      note: note.trim(),
      status: existingOrder.status,
    },
  });
}

async function fetchOrderStatsForUsers(
  userIds: string[]
): Promise<Map<string, { count: number; spent: number }>> {
  const stats = new Map<string, { count: number; spent: number }>();
  if (userIds.length === 0) return stats;

  const orders = await pgOrder.listOrdersForUsers(userIds);
  orders.forEach((order) => {
    const uid = order.userId ?? "";
    if (!uid) return;
    const existing = stats.get(uid) ?? { count: 0, spent: 0 };
    existing.count += 1;
    if (order.paymentStatus === "paid" || order.paymentStatus === "cod_pending") {
      existing.spent += order.total;
    }
    stats.set(uid, existing);
  });

  return stats;
}

export async function listCustomers(
  options: {
    search?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {}
): Promise<PaginatedCustomersResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const users = await pgUsers.listRecentUsers(500);
  let start = 0;

  if (options.cursor) {
    const index = users.findIndex((user) => user.id === options.cursor);
    if (index >= 0) start = index + 1;
  } else if (options.offset && options.offset > 0) {
    start = options.offset;
  }

  const pageUsers = users.slice(start, start + limit + 1);
  const hasMore = pageUsers.length > limit;
  const slice = pageUsers.slice(0, limit);
  const orderStats = await fetchOrderStatsForUsers(slice.map((user) => user.id));

  let customers = slice.map((user) => {
    const stats = orderStats.get(user.id) ?? { count: 0, spent: 0 };
    return {
      uid: user.id,
      email: user.email,
      displayName: user.name ?? "",
      isActive: user.isActive,
      orderCount: stats.count,
      totalSpent: stats.spent,
      createdAt: user.createdAt,
    };
  });

  if (options.search) {
    const q = options.search.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q)
    );
  }

  return {
    customers,
    hasMore: options.search ? customers.length >= limit : hasMore,
    nextCursor: hasMore && slice.length > 0 ? slice[slice.length - 1]!.id : undefined,
    total: undefined,
  };
}

export async function getCustomerDetail(uid: string) {
  const user = await pgUsers.getUserProfile(uid);
  if (!user) return null;

  const orders = await pgOrder.listOrdersByUserId(uid);

  return {
    uid,
    email: user.email,
    displayName: user.name ?? "",
    photoURL: user.image ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    orders,
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, order) => {
      if (order.paymentStatus === "paid" || order.paymentStatus === "cod_pending") {
        return sum + order.total;
      }
      return sum;
    }, 0),
  };
}

export async function updateCustomerStatus(
  uid: string,
  isActive: boolean
): Promise<void> {
  await pgUsers.updateUserActiveStatus(uid, isActive);
}

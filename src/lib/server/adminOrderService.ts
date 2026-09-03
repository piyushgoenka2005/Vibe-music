import { logAuditEvent } from "@/lib/server/auditLog";
import { releaseOrderInventory } from "@/lib/server/inventoryService";
import {
  notifyOrderRefunded,
  notifyOrderStatusChanged,
} from "@/lib/server/orderNotificationService";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { prisma } from "@/lib/db/prisma";
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

export async function listAllOrders(
  options: {
    status?: OrderStatus;
    search?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {},
): Promise<PaginatedOrdersResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  // Filtering, ordering, and pagination are all pushed into Postgres so admin
  // order search never loads the full table (or skips rows while paging).
  const page = await pgOrder.listOrdersPaginated({
    status: options.status,
    search: options.search,
    limit,
    cursor: options.cursor,
    offset: options.offset,
  });

  return {
    orders: page.orders,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actor: string,
  note?: string,
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

export async function addOrderNote(orderId: string, note: string, actor: string): Promise<void> {
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
  userIds: string[],
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
  } = {},
): Promise<PaginatedCustomersResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  // DB-side search + pagination (previously capped at the 500 most recent
  // users, which silently hid older customers from search and CSV export).
  const page = await pgUsers.listUsersPaginated({
    search: options.search,
    limit,
    cursor: options.cursor,
    offset: options.offset,
  });

  const orderStats = await fetchOrderStatsForUsers(page.users.map((user) => user.id));

  const customers = page.users.map((user) => {
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

  return {
    customers,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
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

export async function updateCustomerStatus(uid: string, isActive: boolean): Promise<void> {
  await pgUsers.updateUserActiveStatus(uid, isActive);
}

export async function eraseCustomer(uid: string): Promise<void> {
  const user = await pgUsers.getUserProfile(uid);
  if (!user) throw new Error("Customer not found");

  const adminRow = await prisma.admin.findUnique({ where: { uid } });
  if (adminRow) {
    throw new Error("Cannot erase an admin account from Customers");
  }

  const email = user.email;
  await prisma.$transaction(async (tx) => {
    await tx.userNotification.deleteMany({ where: { userId: uid } });
    await tx.order.updateMany({
      where: { userId: uid },
      data: {
        email: `erased+${uid.slice(0, 8)}@deleted.local`,
        customerName: "Erased customer",
        customerPhone: null,
        userId: null,
        shippingAddress: asJsonValue({
          name: "Erased",
          line1: "Redacted",
          city: "Redacted",
          state: "NA",
          postalCode: "000000",
          country: "IN",
        }),
      },
    });
    if (email) {
      await tx.newsletterSubscriber.deleteMany({
        where: { email: email.toLowerCase() },
      });
    }
    await tx.user.delete({ where: { id: uid } });
  });
}

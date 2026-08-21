import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Order } from "@/types/order";
import { orderToPrisma, prismaToOrder } from "./mappers";

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id: orderId } });
  return row ? prismaToOrder(row) : null;
}

export async function findOrderByRazorpayOrderId(
  razorpayOrderId: string
): Promise<Order | null> {
  const row = await prisma.order.findFirst({ where: { razorpayOrderId } });
  return row ? prismaToOrder(row) : null;
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string
): Promise<Order | null> {
  const row = await prisma.order.findFirst({ where: { razorpayPaymentId } });
  return row ? prismaToOrder(row) : null;
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(prismaToOrder);
}

export async function listOrdersByEmail(email: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(prismaToOrder);
}

export async function listRecentOrders(limit = 10): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return rows.map(prismaToOrder);
}

const PAID_PAYMENT_STATUSES = ["paid", "cod_pending"] as const;

export interface RevenueWindow {
  /** Inclusive lower bound (ISO string, matches `created_at`). */
  from?: string;
  /** Exclusive upper bound (ISO string, matches `created_at`). */
  to?: string;
}

function revenueWindowWhere(window?: RevenueWindow) {
  return {
    paymentStatus: { in: [...PAID_PAYMENT_STATUSES] },
    ...(window?.from || window?.to
      ? {
          createdAt: {
            ...(window.from ? { gte: window.from } : {}),
            ...(window.to ? { lt: window.to } : {}),
          },
        }
      : {}),
  };
}

/** SUM(total) over paid orders — computed in Postgres, not by loading every row. */
export async function sumPaidRevenue(window?: RevenueWindow): Promise<number> {
  const result = await prisma.order.aggregate({
    where: revenueWindowWhere(window),
    _sum: { total: true },
  });
  return result._sum.total ?? 0;
}

/** COUNT(*) over an optional created_at window. */
export async function countOrdersBetween(
  window?: RevenueWindow
): Promise<number> {
  const where = window?.from || window?.to
    ? {
        createdAt: {
          ...(window.from ? { gte: window.from } : {}),
          ...(window.to ? { lt: window.to } : {}),
        },
      }
    : undefined;
  return prisma.order.count({ where });
}

/** Order counts per status in a single GROUP BY query. */
export async function countOrdersGroupedByStatus(): Promise<
  Record<string, number>
> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return Object.fromEntries(
    rows.map((row) => [row.status, row._count._all])
  );
}

export interface DailyRevenueBucket {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Day-bucketed paid revenue via SQL aggregation. `created_at` is stored as an
 * ISO string, so cast to timestamptz and bucket in UTC (matches the previous
 * JS `toISOString().slice(0, 10)` bucketing exactly).
 */
export async function getDailyPaidRevenueBuckets(
  sinceIso: string
): Promise<DailyRevenueBucket[]> {
  const paymentStatuses = Prisma.join([...PAID_PAYMENT_STATUSES]);
  const rows = await prisma.$queryRaw<{ date: string; revenue: number; orders: bigint }[]>(
    Prisma.sql`
      SELECT to_char((created_at::timestamptz) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COALESCE(SUM(total), 0)::float AS revenue,
             COUNT(*)::int AS orders
      FROM orders
      WHERE payment_status IN (${paymentStatuses})
        AND (created_at::timestamptz) >= ${sinceIso}::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `
  );
  return rows.map((row) => ({
    date: row.date,
    revenue: Number(row.revenue ?? 0),
    orders: Number(row.orders ?? 0),
  }));
}

export async function createOrder(order: Order): Promise<void> {
  await prisma.order.create({ data: orderToPrisma(order) });
}

export async function updateOrder(order: Order): Promise<void> {
  await prisma.order.update({
    where: { id: order.id },
    data: orderToPrisma(order),
  });
}

export async function upsertOrder(order: Order): Promise<void> {
  await prisma.order.upsert({
    where: { id: order.id },
    create: orderToPrisma(order),
    update: orderToPrisma(order),
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  await prisma.order.delete({ where: { id: orderId } });
}

export async function patchOrderFields(
  orderId: string,
  patch: Partial<Order>
): Promise<Order> {
  const existing = await fetchOrderById(orderId);
  if (!existing) throw new Error("Order not found");
  const updated: Order = {
    ...existing,
    ...patch,
    id: orderId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  await updateOrder(updated);
  return updated;
}

export async function listGuestOrdersByEmail(email: string): Promise<Order[]> {
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.order.findMany({
    where: { email: normalized, userId: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(prismaToOrder);
}

export async function linkGuestOrdersToUser(
  _userId: string,
  _email: string
): Promise<number> {
  // Disabled: do not auto-claim all guest orders by email (IDOR).
  return 0;
}

export async function attachPaidOrderToUser(
  orderId: string,
  userId: string,
  email: string
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !orderId || !userId) return false;
  const timestamp = new Date().toISOString();
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return false;
  if (existing.userId && existing.userId !== userId) return false;
  if ((existing.email ?? "").trim().toLowerCase() !== normalized) return false;

  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      userId: null,
    },
    data: { userId, isGuestOrder: false, updatedAt: timestamp },
  });
  return result.count > 0;
}

export async function listOrdersPaginated(options: {
  status?: string;
  limit?: number;
  cursor?: string;
  offset?: number;
}): Promise<{ orders: Order[]; hasMore: boolean; nextCursor?: string }> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const where = options.status ? { status: options.status } : undefined;
  let orders = (await prisma.order.findMany({ where, orderBy: { createdAt: "desc" } })).map(
    prismaToOrder
  );

  if (options.cursor) {
    const index = orders.findIndex((order) => order.id === options.cursor);
    if (index >= 0) orders = orders.slice(index + 1);
  } else if (options.offset && options.offset > 0) {
    orders = orders.slice(options.offset);
  }

  const page = orders.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const items = page.slice(0, limit);
  return {
    orders: items,
    hasMore,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined,
  };
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const entries = await Promise.all(
    statuses.map(async (status) => [
      status,
      await prisma.order.count({ where: { status } }),
    ] as const)
  );
  return Object.fromEntries(entries);
}

export async function countOrders(): Promise<number> {
  return prisma.order.count();
}

export async function findPaidOrders(options?: {
  sinceDays?: number;
}): Promise<Order[]> {
  const sinceDays = options?.sinceDays ?? 90;
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.order.findMany({
    where: {
      OR: [{ paymentStatus: "paid" }, { paymentStatus: "cod_pending" }],
      createdAt: { gte: since.toISOString() },
    },
    orderBy: { createdAt: "desc" },
    take: 5_000,
  });
  return rows.map(prismaToOrder);
}

export async function listOrdersForUsers(userIds: string[]): Promise<Order[]> {
  if (userIds.length === 0) return [];
  const rows = await prisma.order.findMany({
    where: { userId: { in: userIds } },
  });
  return rows.map(prismaToOrder);
}

export async function listOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(prismaToOrder);
}

export async function findPurchasedProductOrders(
  userId: string,
  email: string | null | undefined,
  productId: string
): Promise<Order[]> {
  const orders = new Map<string, Order>();
  for (const order of await listOrdersForUser(userId)) {
    orders.set(order.id, order);
  }
  if (email) {
    for (const order of await listOrdersByEmail(email.trim().toLowerCase())) {
      orders.set(order.id, order);
    }
  }
  return [...orders.values()].filter(
    (order) =>
      order.paymentStatus === "paid" &&
      ["delivered", "shipped", "confirmed"].includes(order.status) &&
      order.items.some((item) => item.productId === productId)
  );
}

import "server-only";

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

export async function listAllOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(prismaToOrder);
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
  userId: string,
  email: string
): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const timestamp = new Date().toISOString();
  const result = await prisma.order.updateMany({
    where: { email: normalized, userId: null },
    data: { userId, isGuestOrder: false, updatedAt: timestamp },
  });
  return result.count;
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

export async function findPaidOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: {
      OR: [{ paymentStatus: "paid" }, { paymentStatus: "cod_pending" }],
    },
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

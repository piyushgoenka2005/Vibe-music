import "server-only";

import type { Prisma } from "@prisma/client";
import { formatOrderId, getOrderYear, ORDER_ID_SEQUENCE_START } from "@/lib/orderId";
import { isPostgresConfigured } from "@/lib/db/prisma";
import * as pg from "@/lib/server/prisma/orderRepository";
import type { Order } from "@/types/order";

export function generateOrderId(date = new Date()): string {
  return formatOrderId(ORDER_ID_SEQUENCE_START, getOrderYear(date));
}

export async function persistOrder(order: Order): Promise<void> {
  await pg.upsertOrder(order);
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!isPostgresConfigured()) {
    return null;
  }
  return pg.fetchOrderById(orderId);
}

export async function lockOrderInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<Order | null> {
  if (!isPostgresConfigured()) {
    return pg.fetchOrderById(orderId);
  }
  return pg.lockOrderInTx(tx, orderId);
}

export async function updateOrderInTx(
  tx: Prisma.TransactionClient,
  order: Order,
  patch?: Partial<Order>,
): Promise<Order> {
  return pg.updateOrderInTx(tx, order, patch);
}

/**
 * Atomic scalar-field update without a read-modify-write fetch. Returns false
 * when the order does not exist (or Postgres is not configured).
 */
export async function updateOrderFields(
  orderId: string,
  data: Prisma.OrderUpdateManyMutationInput,
): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  return pg.updateOrderFields(orderId, data);
}

export async function removeOrder(orderId: string): Promise<void> {
  await pg.deleteOrder(orderId);
}

export async function findOrderByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
  if (!isPostgresConfigured()) {
    return null;
  }
  return pg.findOrderByRazorpayOrderId(razorpayOrderId);
}

export async function findOrderByRazorpayPaymentId(
  razorpayPaymentId: string,
): Promise<Order | null> {
  if (!isPostgresConfigured()) {
    return null;
  }
  return pg.findOrderByRazorpayPaymentId(razorpayPaymentId);
}

export async function listOrdersForUser(uid?: string, email?: string): Promise<Order[]> {
  if (!isPostgresConfigured()) {
    return [];
  }

  const byId = new Map<string, Order>();

  if (uid) {
    for (const order of await pg.listOrdersForUser(uid)) {
      byId.set(order.id, order);
    }
  }

  if (email) {
    for (const order of await pg.listOrdersByEmail(email.trim().toLowerCase())) {
      byId.set(order.id, order);
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
  );
}

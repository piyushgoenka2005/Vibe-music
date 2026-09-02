import "server-only";

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

export async function updateOrder(orderId: string, patch: Partial<Order>): Promise<Order> {
  const existing = await pg.fetchOrderById(orderId);
  if (!existing) {
    throw new Error("Order not found");
  }

  const updated: Order = {
    ...existing,
    ...patch,
    id: orderId,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };

  await pg.updateOrder(updated);
  return updated;
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

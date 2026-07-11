import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import type { PaymentLog, PaymentLogStatus } from "@/types/payment";

function now(): string {
  return new Date().toISOString();
}

function mapPaymentLog(row: {
  id: string;
  razorpayEventId: string;
  eventType: string;
  status: string;
  orderId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayRefundId: string | null;
  payload: unknown;
  error: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
}): PaymentLog {
  return {
    id: row.id,
    razorpayEventId: row.razorpayEventId,
    eventType: row.eventType,
    status: row.status as PaymentLogStatus,
    orderId: row.orderId,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    razorpayRefundId: row.razorpayRefundId,
    payload: (row.payload as Record<string, unknown>) ?? {},
    error: row.error,
    attemptCount: row.attemptCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    processedAt: row.processedAt,
  };
}

export async function getPaymentLogByEventId(
  razorpayEventId: string
): Promise<PaymentLog | null> {
  const row = await prisma.paymentLog.findUnique({
    where: { razorpayEventId },
  });
  return row ? mapPaymentLog(row) : null;
}

export async function createOrGetPaymentLog(input: {
  razorpayEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  orderId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayRefundId?: string | null;
}): Promise<{ log: PaymentLog; isNew: boolean }> {
  const existing = await prisma.paymentLog.findUnique({
    where: { razorpayEventId: input.razorpayEventId },
  });
  if (existing) {
    return { log: mapPaymentLog(existing), isNew: false };
  }

  const timestamp = now();
  const log: PaymentLog = {
    id: input.razorpayEventId,
    razorpayEventId: input.razorpayEventId,
    eventType: input.eventType,
    status: "received",
    orderId: input.orderId ?? null,
    razorpayOrderId: input.razorpayOrderId ?? null,
    razorpayPaymentId: input.razorpayPaymentId ?? null,
    razorpayRefundId: input.razorpayRefundId ?? null,
    payload: input.payload,
    error: null,
    attemptCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    processedAt: null,
  };

  await prisma.paymentLog.create({
    data: {
      id: log.id,
      razorpayEventId: log.razorpayEventId,
      eventType: log.eventType,
      status: log.status,
      orderId: log.orderId,
      razorpayOrderId: log.razorpayOrderId,
      razorpayPaymentId: log.razorpayPaymentId,
      razorpayRefundId: log.razorpayRefundId,
      payload: asJsonValue(log.payload),
      error: log.error,
      attemptCount: log.attemptCount,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      processedAt: log.processedAt,
    },
  });

  return { log, isNew: true };
}

export async function updatePaymentLogStatus(
  razorpayEventId: string,
  patch: Partial<
    Pick<
      PaymentLog,
      | "status"
      | "error"
      | "processedAt"
      | "orderId"
      | "razorpayOrderId"
      | "razorpayPaymentId"
      | "razorpayRefundId"
      | "attemptCount"
    >
  >
): Promise<void> {
  await prisma.paymentLog.update({
    where: { razorpayEventId },
    data: {
      ...patch,
      updatedAt: now(),
    },
  });
}

export async function listPaymentLogs(limit = 50): Promise<PaymentLog[]> {
  const rows = await prisma.paymentLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapPaymentLog);
}

export async function countPaymentLogsByStatus(
  status: PaymentLogStatus
): Promise<number> {
  return prisma.paymentLog.count({ where: { status } });
}

export async function getRecentFailedPaymentLogs(
  limit = 10
): Promise<PaymentLog[]> {
  const rows = await prisma.paymentLog.findMany({
    where: { status: "failed" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapPaymentLog);
}

export async function getPaymentLogsSince(
  sinceIso: string
): Promise<PaymentLog[]> {
  const rows = await prisma.paymentLog.findMany({
    where: { createdAt: { gte: sinceIso } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapPaymentLog);
}

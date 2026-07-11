import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { ReturnRequest, ReturnRequestStatus } from "@/types/returnRequest";

export const RETURN_REQUESTS_COLLECTION = "returnRequests";

function mapReturnRequest(row: {
  id: string;
  orderId: string;
  userId: string | null;
  email: string;
  reason: string;
  details: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}): ReturnRequest {
  return {
    id: row.id,
    orderId: row.orderId,
    userId: row.userId ?? undefined,
    email: row.email,
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status as ReturnRequestStatus,
    adminNote: row.adminNote ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createReturnRequest(
  input: Omit<ReturnRequest, "id" | "status" | "createdAt" | "updatedAt">
): Promise<ReturnRequest> {
  const now = new Date().toISOString();
  const record: ReturnRequest = {
    id: randomUUID(),
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await prisma.returnRequest.create({
    data: {
      id: record.id,
      orderId: record.orderId,
      userId: record.userId ?? null,
      email: record.email,
      reason: record.reason,
      details: record.details ?? null,
      status: record.status,
      adminNote: record.adminNote ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });

  return record;
}

export async function getReturnRequestById(
  id: string
): Promise<ReturnRequest | null> {
  const row = await prisma.returnRequest.findUnique({ where: { id } });
  return row ? mapReturnRequest(row) : null;
}

export async function listReturnRequestsByOrderId(
  orderId: string
): Promise<ReturnRequest[]> {
  const rows = await prisma.returnRequest.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapReturnRequest);
}

export async function listReturnRequests(options: {
  status?: ReturnRequestStatus;
  limit?: number;
} = {}): Promise<ReturnRequest[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const rows = await prisma.returnRequest.findMany({
    where: options.status ? { status: options.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapReturnRequest);
}

export async function updateReturnRequest(
  id: string,
  patch: Partial<Pick<ReturnRequest, "status" | "adminNote">>
): Promise<ReturnRequest> {
  const now = new Date().toISOString();
  await prisma.returnRequest.update({
    where: { id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote ?? null } : {}),
      updatedAt: now,
    },
  });
  const updated = await getReturnRequestById(id);
  if (!updated) throw new Error("Return request not found after update");
  return updated;
}

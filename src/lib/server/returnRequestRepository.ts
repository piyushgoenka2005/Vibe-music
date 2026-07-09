import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { ReturnRequest, ReturnRequestStatus } from "@/types/returnRequest";

export const RETURN_REQUESTS_COLLECTION = "returnRequests";

function normalizeReturnRequest(
  id: string,
  data: FirebaseFirestore.DocumentData
): ReturnRequest {
  return {
    id,
    orderId: String(data.orderId ?? ""),
    userId: data.userId ? String(data.userId) : undefined,
    email: String(data.email ?? ""),
    reason: String(data.reason ?? ""),
    details: data.details ? String(data.details) : undefined,
    status: (data.status as ReturnRequestStatus) ?? "pending",
    adminNote: data.adminNote ? String(data.adminNote) : undefined,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function createReturnRequest(
  input: Omit<ReturnRequest, "id" | "status" | "createdAt" | "updatedAt">
): Promise<ReturnRequest> {
  const db = getAdminFirestore();
  const ref = db.collection(RETURN_REQUESTS_COLLECTION).doc();
  const now = new Date().toISOString();
  const record: ReturnRequest = {
    id: ref.id,
    ...input,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(record);
  return record;
}

export async function getReturnRequestById(
  id: string
): Promise<ReturnRequest | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(RETURN_REQUESTS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeReturnRequest(doc.id, doc.data()!);
}

export async function listReturnRequestsByOrderId(
  orderId: string
): Promise<ReturnRequest[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(RETURN_REQUESTS_COLLECTION)
    .where("orderId", "==", orderId)
    .get();
  return snap.docs
    .map((doc) => normalizeReturnRequest(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReturnRequests(options: {
  status?: ReturnRequestStatus;
  limit?: number;
} = {}): Promise<ReturnRequest[]> {
  const db = getAdminFirestore();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  let query: FirebaseFirestore.Query = db.collection(RETURN_REQUESTS_COLLECTION);

  if (options.status) {
    query = query.where("status", "==", options.status);
  }

  const snap = await query.limit(limit).get();
  return snap.docs
    .map((doc) => normalizeReturnRequest(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateReturnRequest(
  id: string,
  patch: Partial<Pick<ReturnRequest, "status" | "adminNote">>
): Promise<ReturnRequest> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db.collection(RETURN_REQUESTS_COLLECTION).doc(id).update({
    ...patch,
    updatedAt: now,
  });
  const updated = await getReturnRequestById(id);
  if (!updated) throw new Error("Return request not found after update");
  return updated;
}

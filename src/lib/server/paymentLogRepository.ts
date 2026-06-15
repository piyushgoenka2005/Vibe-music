import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { PaymentLog, PaymentLogStatus } from "@/types/payment";

const COLLECTION = "payment_logs";

function now(): string {
  return new Date().toISOString();
}

export async function getPaymentLogByEventId(
  razorpayEventId: string
): Promise<PaymentLog | null> {
  const doc = await getAdminFirestore()
    .collection(COLLECTION)
    .doc(razorpayEventId)
    .get();
  if (!doc.exists) return null;
  return doc.data() as PaymentLog;
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
  const ref = getAdminFirestore().collection(COLLECTION).doc(input.razorpayEventId);
  const existing = await ref.get();

  if (existing.exists) {
    return { log: existing.data() as PaymentLog, isNew: false };
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

  await ref.create(log);
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
  await getAdminFirestore()
    .collection(COLLECTION)
    .doc(razorpayEventId)
    .update({
      ...patch,
      updatedAt: now(),
    });
}

export async function listPaymentLogs(limit = 50): Promise<PaymentLog[]> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => doc.data() as PaymentLog);
}

export async function countPaymentLogsByStatus(
  status: PaymentLogStatus
): Promise<number> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("status", "==", status)
    .get();
  return snap.size;
}

export async function getRecentFailedPaymentLogs(
  limit = 10
): Promise<PaymentLog[]> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("status", "==", "failed")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => doc.data() as PaymentLog);
}

export async function getPaymentLogsSince(
  sinceIso: string
): Promise<PaymentLog[]> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("createdAt", ">=", sinceIso)
    .get();

  return snap.docs.map((doc) => doc.data() as PaymentLog);
}

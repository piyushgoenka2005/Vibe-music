import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Shipment, ShipmentCarrier, ShipmentStatus, TrackingEvent } from "@/types/shipment";
import { carrierLabel } from "@/types/shipment";

export const SHIPMENTS_COLLECTION = "shipments";
export const TRACKING_EVENTS_COLLECTION = "trackingEvents";

function str(value: unknown, fallback = ""): string {
  return value != null ? String(value) : fallback;
}

export function normalizeShipment(
  id: string,
  data: FirebaseFirestore.DocumentData
): Shipment {
  const carrier = str(data.carrier, "other") as ShipmentCarrier;
  return {
    id,
    orderId: str(data.orderId),
    trackingNumber: str(data.trackingNumber),
    carrier,
    carrierName: str(data.carrierName) || carrierLabel(carrier),
    status: (str(data.status, "pending") as ShipmentStatus) || "pending",
    estimatedDelivery: data.estimatedDelivery ? str(data.estimatedDelivery) : null,
    shippedAt: data.shippedAt ? str(data.shippedAt) : null,
    deliveredAt: data.deliveredAt ? str(data.deliveredAt) : null,
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

export function normalizeTrackingEvent(
  id: string,
  data: FirebaseFirestore.DocumentData
): TrackingEvent {
  return {
    id,
    shipmentId: str(data.shipmentId),
    orderId: str(data.orderId),
    status: str(data.status, "pending") as ShipmentStatus,
    title: str(data.title),
    description: data.description ? str(data.description) : undefined,
    location: data.location ? str(data.location) : undefined,
    occurredAt: str(data.occurredAt),
    createdAt: str(data.createdAt),
    actor: data.actor ? str(data.actor) : undefined,
  };
}

export async function getShipmentByOrderId(
  orderId: string
): Promise<Shipment | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(SHIPMENTS_COLLECTION).doc(orderId).get();
  if (!doc.exists) return null;
  return normalizeShipment(doc.id, doc.data()!);
}

export async function getTrackingEventsByOrderId(
  orderId: string
): Promise<TrackingEvent[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(TRACKING_EVENTS_COLLECTION)
    .where("orderId", "==", orderId)
    .get();

  return snap.docs
    .map((doc) => normalizeTrackingEvent(doc.id, doc.data()))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function upsertShipmentRecord(
  orderId: string,
  input: {
    trackingNumber: string;
    carrier: ShipmentCarrier;
    carrierName: string;
    status: ShipmentStatus;
    estimatedDelivery?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
  }
): Promise<Shipment> {
  const db = getAdminFirestore();
  const ref = db.collection(SHIPMENTS_COLLECTION).doc(orderId);
  const existing = await ref.get();
  const existingData = existing.exists ? existing.data() : null;
  const now = new Date().toISOString();
  const shippedAt =
    input.shippedAt ??
    (existingData?.shippedAt ? str(existingData.shippedAt) : null) ??
    (input.status !== "pending" ? now : null);

  const record: Shipment = {
    id: orderId,
    orderId,
    trackingNumber: input.trackingNumber,
    carrier: input.carrier,
    carrierName: input.carrierName,
    status: input.status,
    estimatedDelivery: input.estimatedDelivery ?? null,
    shippedAt,
    deliveredAt:
      input.deliveredAt ??
      (existingData?.deliveredAt ? str(existingData.deliveredAt) : null) ??
      (input.status === "delivered" ? now : null),
    createdAt: existing.exists
      ? str(existingData?.createdAt, now)
      : now,
    updatedAt: now,
  };

  if (input.status === "delivered" && !record.deliveredAt) {
    record.deliveredAt = now;
  }

  await ref.set(record, { merge: true });
  return record;
}

export async function createTrackingEventRecord(input: {
  shipmentId: string;
  orderId: string;
  status: ShipmentStatus;
  title: string;
  description?: string;
  location?: string;
  occurredAt?: string;
  actor?: string;
}): Promise<TrackingEvent> {
  const db = getAdminFirestore();
  const ref = db.collection(TRACKING_EVENTS_COLLECTION).doc();
  const now = new Date().toISOString();

  const record: TrackingEvent = {
    id: ref.id,
    shipmentId: input.shipmentId,
    orderId: input.orderId,
    status: input.status,
    title: input.title,
    description: input.description,
    location: input.location,
    occurredAt: input.occurredAt ?? now,
    createdAt: now,
    actor: input.actor,
  };

  await ref.set(record);
  return record;
}

export async function updateShipmentStatus(
  orderId: string,
  status: ShipmentStatus,
  timestamps?: { shippedAt?: string; deliveredAt?: string }
): Promise<void> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const patch: Record<string, string> = { status, updatedAt: now };

  if (timestamps?.shippedAt) patch.shippedAt = timestamps.shippedAt;
  if (timestamps?.deliveredAt) patch.deliveredAt = timestamps.deliveredAt;
  if (status === "delivered") patch.deliveredAt = timestamps?.deliveredAt ?? now;

  await db.collection(SHIPMENTS_COLLECTION).doc(orderId).update(patch);
}

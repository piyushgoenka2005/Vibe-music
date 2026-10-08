import "server-only";

import { randomUUID } from "crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import type { Shipment, ShipmentCarrier, ShipmentStatus, TrackingEvent } from "@/types/shipment";
import { carrierLabel } from "@/types/shipment";

export const SHIPMENTS_COLLECTION = "shipments";
export const TRACKING_EVENTS_COLLECTION = "trackingEvents";

function mapShipment(row: {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: string;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}): Shipment {
  const carrier = row.carrier as ShipmentCarrier;
  return {
    id: row.id,
    orderId: row.orderId,
    trackingNumber: row.trackingNumber,
    carrier,
    carrierName: row.carrierName || carrierLabel(carrier),
    status: row.status as ShipmentStatus,
    estimatedDelivery: row.estimatedDelivery,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapTrackingEvent(row: {
  id: string;
  shipmentId: string;
  orderId: string;
  status: string;
  title: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
  createdAt: string;
  actor: string | null;
}): TrackingEvent {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    orderId: row.orderId,
    status: row.status as ShipmentStatus,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
    actor: row.actor ?? undefined,
  };
}

export function normalizeShipment(id: string, data: Record<string, unknown>): Shipment {
  const carrier = String(data.carrier ?? "other") as ShipmentCarrier;
  return {
    id,
    orderId: String(data.orderId ?? ""),
    trackingNumber: String(data.trackingNumber ?? ""),
    carrier,
    carrierName: String(data.carrierName ?? "") || carrierLabel(carrier),
    status: (String(data.status ?? "pending") as ShipmentStatus) || "pending",
    estimatedDelivery: data.estimatedDelivery ? String(data.estimatedDelivery) : null,
    shippedAt: data.shippedAt ? String(data.shippedAt) : null,
    deliveredAt: data.deliveredAt ? String(data.deliveredAt) : null,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export function normalizeTrackingEvent(id: string, data: Record<string, unknown>): TrackingEvent {
  return {
    id,
    shipmentId: String(data.shipmentId ?? ""),
    orderId: String(data.orderId ?? ""),
    status: String(data.status ?? "pending") as ShipmentStatus,
    title: String(data.title ?? ""),
    description: data.description ? String(data.description) : undefined,
    location: data.location ? String(data.location) : undefined,
    occurredAt: String(data.occurredAt ?? ""),
    createdAt: String(data.createdAt ?? ""),
    actor: data.actor ? String(data.actor) : undefined,
  };
}

export async function getShipmentByOrderId(orderId: string): Promise<Shipment | null> {
  if (!isPostgresConfigured()) return null;
  const row = await prisma.shipment.findUnique({ where: { orderId } });
  return row ? mapShipment(row) : null;
}

export async function getTrackingEventsByOrderId(orderId: string): Promise<TrackingEvent[]> {
  if (!isPostgresConfigured()) return [];
  const rows = await prisma.trackingEvent.findMany({
    where: { orderId },
    orderBy: { occurredAt: "desc" },
  });
  return rows.map(mapTrackingEvent);
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
  },
): Promise<Shipment> {
  const existing = await prisma.shipment.findUnique({ where: { orderId } });
  const timestamp = new Date().toISOString();
  const shippedAt =
    input.shippedAt ?? existing?.shippedAt ?? (input.status !== "pending" ? timestamp : null);

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
      existing?.deliveredAt ??
      (input.status === "delivered" ? timestamp : null),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  if (input.status === "delivered" && !record.deliveredAt) {
    record.deliveredAt = timestamp;
  }

  await prisma.shipment.upsert({
    where: { orderId },
    create: {
      id: orderId,
      orderId: record.orderId,
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      carrierName: record.carrierName,
      status: record.status,
      estimatedDelivery: record.estimatedDelivery,
      shippedAt: record.shippedAt,
      deliveredAt: record.deliveredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    update: {
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      carrierName: record.carrierName,
      status: record.status,
      estimatedDelivery: record.estimatedDelivery,
      shippedAt: record.shippedAt,
      deliveredAt: record.deliveredAt,
      updatedAt: record.updatedAt,
    },
  });

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
  const timestamp = new Date().toISOString();
  const id = randomUUID();

  const record: TrackingEvent = {
    id,
    shipmentId: input.shipmentId,
    orderId: input.orderId,
    status: input.status,
    title: input.title,
    description: input.description,
    location: input.location,
    occurredAt: input.occurredAt ?? timestamp,
    createdAt: timestamp,
    actor: input.actor,
  };

  await prisma.trackingEvent.create({
    data: {
      id: record.id,
      shipmentId: record.shipmentId,
      orderId: record.orderId,
      status: record.status,
      title: record.title,
      description: record.description ?? null,
      location: record.location ?? null,
      occurredAt: record.occurredAt,
      createdAt: record.createdAt,
      actor: record.actor ?? null,
    },
  });

  return record;
}

export async function updateShipmentStatus(
  orderId: string,
  status: ShipmentStatus,
  timestamps?: { shippedAt?: string; deliveredAt?: string },
): Promise<void> {
  const timestamp = new Date().toISOString();
  await prisma.shipment.update({
    where: { orderId },
    data: {
      status,
      updatedAt: timestamp,
      ...(timestamps?.shippedAt ? { shippedAt: timestamps.shippedAt } : {}),
      ...(timestamps?.deliveredAt || status === "delivered"
        ? { deliveredAt: timestamps?.deliveredAt ?? timestamp }
        : {}),
    },
  });
}

import "server-only";

import { updateOrderStatus } from "@/lib/server/adminOrderService";
import {
  createTrackingEventRecord,
  getShipmentByOrderId,
  getTrackingEventsByOrderId,
  upsertShipmentRecord,
  updateShipmentStatus,
} from "@/lib/server/shipmentRepository";
import type { Order } from "@/types/order";
import type {
  PublicShipmentTracking,
  Shipment,
  ShipmentCarrier,
  ShipmentStatus,
  TrackingEvent,
} from "@/types/shipment";
import {
  carrierLabel,
  shipmentStatusLabel,
  SHIPMENT_STATUS_LABELS,
} from "@/types/shipment";
import type { OrderTracking } from "@/types/orderTracking";
import { toOrderTracking } from "@/types/orderTracking";

function defaultEventTitle(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

function mapOrderStatusForShipment(status: ShipmentStatus): Order["status"] | null {
  switch (status) {
    case "label_created":
    case "picked_up":
    case "in_transit":
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    default:
      return null;
  }
}

export function toPublicShipmentTracking(
  shipment: Shipment | null,
  events: TrackingEvent[]
): PublicShipmentTracking | null {
  if (!shipment) return null;

  return {
    trackingNumber: shipment.trackingNumber,
    carrier: shipment.carrierName,
    carrierCode: shipment.carrier,
    status: shipment.status,
    statusLabel: shipmentStatusLabel(shipment.status),
    estimatedDelivery: shipment.estimatedDelivery,
    shippedAt: shipment.shippedAt,
    deliveredAt: shipment.deliveredAt,
    events: events.map((event) => ({
      id: event.id,
      status: event.status,
      title: event.title,
      description: event.description,
      location: event.location,
      occurredAt: event.occurredAt,
    })),
  };
}

export async function getOrderShipmentDetails(orderId: string): Promise<{
  shipment: Shipment | null;
  events: TrackingEvent[];
}> {
  const [shipment, events] = await Promise.all([
    getShipmentByOrderId(orderId),
    getTrackingEventsByOrderId(orderId),
  ]);
  return { shipment, events };
}

export async function buildPublicOrderTracking(
  order: Order
): Promise<{
  order: OrderTracking;
  shipment: PublicShipmentTracking | null;
}> {
  const { shipment, events } = await getOrderShipmentDetails(order.id);
  const orderTracking = toOrderTracking(order);

  if (shipment) {
    orderTracking.trackingNumber = shipment.trackingNumber;
    orderTracking.carrier = shipment.carrierName;
    orderTracking.estimatedDelivery = shipment.estimatedDelivery ?? null;
  }

  return {
    order: orderTracking,
    shipment: toPublicShipmentTracking(shipment, events),
  };
}

export async function upsertOrderShipment(
  orderId: string,
  input: {
    trackingNumber: string;
    carrier: ShipmentCarrier;
    carrierName?: string;
    status?: ShipmentStatus;
    estimatedDelivery?: string | null;
  },
  actor: string
): Promise<{ shipment: Shipment; events: TrackingEvent[] }> {
  const existing = await getShipmentByOrderId(orderId);
  const status = input.status ?? existing?.status ?? "label_created";
  const carrierName = input.carrierName?.trim() || carrierLabel(input.carrier);
  const now = new Date().toISOString();

  const shipment = await upsertShipmentRecord(orderId, {
    trackingNumber: input.trackingNumber.trim(),
    carrier: input.carrier,
    carrierName,
    status,
    estimatedDelivery: input.estimatedDelivery ?? existing?.estimatedDelivery ?? null,
    shippedAt: existing?.shippedAt ?? (status !== "pending" ? now : null),
    deliveredAt: status === "delivered" ? now : existing?.deliveredAt ?? null,
  });

  let events = await getTrackingEventsByOrderId(orderId);

  if (!existing) {
    const created = await createTrackingEventRecord({
      shipmentId: shipment.id,
      orderId,
      status: shipment.status,
      title: "Shipment created",
      description: `Tracking number ${shipment.trackingNumber} assigned via ${carrierName}.`,
      occurredAt: now,
      actor,
    });
    events = [created, ...events];
  }

  const orderStatus = mapOrderStatusForShipment(shipment.status);
  if (orderStatus) {
    await updateOrderStatus(orderId, orderStatus, actor, `Shipment ${shipmentStatusLabel(shipment.status)}`);
  }

  return { shipment, events };
}

export async function addOrderTrackingEvent(
  orderId: string,
  input: {
    status: ShipmentStatus;
    title?: string;
    description?: string;
    location?: string;
    occurredAt?: string;
  },
  actor: string
): Promise<{ shipment: Shipment; event: TrackingEvent; events: TrackingEvent[] }> {
  const shipment = await getShipmentByOrderId(orderId);
  if (!shipment) {
    throw new Error("Shipment not found for this order. Add tracking details first.");
  }

  const event = await createTrackingEventRecord({
    shipmentId: shipment.id,
    orderId,
    status: input.status,
    title: input.title?.trim() || defaultEventTitle(input.status),
    description: input.description?.trim(),
    location: input.location?.trim(),
    occurredAt: input.occurredAt,
    actor,
  });

  const now = new Date().toISOString();
  await updateShipmentStatus(orderId, input.status, {
    shippedAt: shipment.shippedAt ?? now,
    deliveredAt: input.status === "delivered" ? now : undefined,
  });

  const orderStatus = mapOrderStatusForShipment(input.status);
  if (orderStatus) {
    await updateOrderStatus(
      orderId,
      orderStatus,
      actor,
      event.title
    );
  }

  const events = await getTrackingEventsByOrderId(orderId);
  const updatedShipment = (await getShipmentByOrderId(orderId))!;

  return { shipment: updatedShipment, event, events };
}

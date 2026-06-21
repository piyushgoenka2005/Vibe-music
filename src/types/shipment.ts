export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "returned";

export type ShipmentCarrier =
  | "bluedart"
  | "delhivery"
  | "dtdc"
  | "fedex"
  | "ups"
  | "india_post"
  | "amazon_logistics"
  | "other";

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: ShipmentCarrier;
  carrierName: string;
  status: ShipmentStatus;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  orderId: string;
  status: ShipmentStatus;
  title: string;
  description?: string;
  location?: string;
  occurredAt: string;
  createdAt: string;
  actor?: string;
}

export interface PublicShipmentTracking {
  trackingNumber: string;
  carrier: string;
  carrierCode: ShipmentCarrier;
  status: ShipmentStatus;
  statusLabel: string;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  events: Array<{
    id: string;
    status: ShipmentStatus;
    title: string;
    description?: string;
    location?: string;
    occurredAt: string;
  }>;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending shipment",
  label_created: "Label created",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Delivery exception",
  returned: "Returned to sender",
};

export const SHIPMENT_CARRIER_LABELS: Record<ShipmentCarrier, string> = {
  bluedart: "Blue Dart",
  delhivery: "Delhivery",
  dtdc: "DTDC",
  fedex: "FedEx",
  ups: "UPS",
  india_post: "India Post",
  amazon_logistics: "Amazon Logistics",
  other: "Other carrier",
};

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

export function carrierLabel(carrier: ShipmentCarrier): string {
  return SHIPMENT_CARRIER_LABELS[carrier] ?? carrier;
}

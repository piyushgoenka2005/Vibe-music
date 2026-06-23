import type {
  OrderTracking,
  OrderTrackingResponse,
} from "@/types/orderTracking";
import type { PublicShipmentTracking } from "@/types/shipment";

export interface OrderTrackingResult {
  order: OrderTracking;
  shipment: PublicShipmentTracking | null;
}

export async function trackOrder(
  orderId: string,
  trackingToken: string
): Promise<OrderTrackingResult | null> {
  const params = new URLSearchParams({ orderId, trackingToken });
  const response = await fetch(`/api/orders/track?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to track order");
  }

  const data = (await response.json()) as OrderTrackingResponse;
  return { order: data.order, shipment: data.shipment };
}

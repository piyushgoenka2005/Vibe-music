import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

/** Public line-item summary for guest order tracking (no pricing breakdown). */
export interface OrderTrackingItemSummary {
  productId: string;
  name: string;
  quantity: number;
}

/** Safe subset of order data for guest tracking — no payment or PII fields. */
export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  createdAt?: string;
  items: OrderTrackingItemSummary[];
  total: number;
}

export interface OrderTrackingResponse {
  order: OrderTracking;
}

/** Optional shipping metadata that may exist on stored orders in the future. */
type OrderWithShippingMeta = Order & {
  orderNumber?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
};

export function toOrderTracking(order: Order): OrderTracking {
  const extended = order as OrderWithShippingMeta;

  return {
    orderId: order.id,
    orderNumber: extended.orderNumber ?? order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: extended.trackingNumber ?? null,
    carrier: extended.carrier ?? null,
    estimatedDelivery: extended.estimatedDelivery ?? null,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
    })),
    total: order.total,
  };
}

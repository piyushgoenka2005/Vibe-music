import "server-only";

import { adminOrderPath } from "@/lib/routes";
import {
  createAdminNotification,
  notifyUserIfAllowed,
} from "@/lib/server/notificationRepository";
import {
  sendOrderRefundEmail,
  sendOrderStatusUpdateEmail,
} from "@/lib/server/customerUpdateEmailService";
import type { Order, OrderStatus } from "@/types/order";

export async function notifyAdminNewOrder(order: Order): Promise<void> {
  void createAdminNotification({
    type: "order",
    title: "New order",
    body: `${order.customerName ?? order.email} — ₹${Math.round(order.total)} (${order.paymentMethod})`,
    link: adminOrderPath(order.id),
  });
}

export async function notifyCustomerOrderPlaced(order: Order): Promise<void> {
  if (!order.userId) return;
  void notifyUserIfAllowed({
    userId: order.userId,
    type: "order_update",
    title: "Order confirmed",
    body: `Order ${order.id.slice(0, 8).toUpperCase()} has been placed successfully.`,
    link: `/account/orders/${order.id}`,
  });
}

/** @deprecated Use notifyAdminNewOrder + notifyCustomerOrderPlaced */
export async function notifyOrderPlaced(order: Order): Promise<void> {
  await notifyAdminNewOrder(order);
  await notifyCustomerOrderPlaced(order);
}

export async function notifyOrderRefunded(order: Order): Promise<void> {
  if (order.userId) {
    void notifyUserIfAllowed({
      userId: order.userId,
      type: "order_update",
      title: "Refund processed",
      body: `A refund was issued for order ${order.id.slice(0, 8).toUpperCase()}.`,
      link: `/account/orders/${order.id}`,
    });
  }
  void sendOrderRefundEmail(order).catch(() => undefined);
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export async function notifyOrderStatusChanged(
  order: Order,
  previousStatus: OrderStatus
): Promise<void> {
  if (order.status === previousStatus) return;

  const label = STATUS_LABELS[order.status] ?? order.status;
  if (order.userId) {
    void notifyUserIfAllowed({
      userId: order.userId,
      type: "order_update",
      title: `Order ${label.toLowerCase()}`,
      body: `Order ${order.id.slice(0, 8).toUpperCase()} is now ${label.toLowerCase()}.`,
      link: `/account/orders/${order.id}`,
    });
  }

  // Shipment emails cover detailed tracking; still notify on non-shipped transitions.
  if (order.status !== "shipped") {
    void sendOrderStatusUpdateEmail({ order, previousStatus }).catch(
      () => undefined
    );
  }
}

import "server-only";

import { ROUTES } from "@/lib/routes";
import {
  createAdminNotification,
  notifyUserIfAllowed,
} from "@/lib/server/notificationRepository";
import type { Order } from "@/types/order";

export async function notifyAdminNewOrder(order: Order): Promise<void> {
  void createAdminNotification({
    type: "order",
    title: "New order",
    body: `${order.customerName ?? order.email} — ₹${Math.round(order.total)} (${order.paymentMethod})`,
    link: ROUTES.adminOrders,
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
  if (!order.userId) return;
  void notifyUserIfAllowed({
    userId: order.userId,
    type: "order_update",
    title: "Refund processed",
    body: `A refund was issued for order ${order.id.slice(0, 8).toUpperCase()}.`,
    link: `/account/orders/${order.id}`,
  });
}

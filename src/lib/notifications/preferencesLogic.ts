import type { NotificationPreferences, NotificationType } from "@/types/notification";

export function isNotificationAllowed(
  type: NotificationType,
  prefs: NotificationPreferences
): boolean {
  if (type === "support_reply" || type === "system") return true;
  if (type === "rental") return prefs.orderUpdates;
  if (type === "order_update") return prefs.orderUpdates;
  if (type === "promotion") return prefs.promotions;
  if (type === "product_alert") return prefs.productAlerts;
  if (type === "newsletter") return prefs.newsletter;
  return false;
}

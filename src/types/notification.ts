export type NotificationType =
  | "order_update"
  | "promotion"
  | "product_alert"
  | "newsletter"
  | "support_reply"
  | "system"
  | "rental";

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  productAlerts: boolean;
  newsletter: boolean;
}

export interface AdminNotification {
  id: string;
  type:
    | "ticket"
    | "return"
    | "contact"
    | "order"
    | "system"
    | "rental";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  orderUpdates: true,
  promotions: false,
  productAlerts: true,
  newsletter: false,
};

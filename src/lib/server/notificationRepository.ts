import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type AdminNotification,
  type NotificationPreferences,
  type NotificationType,
  type UserNotification,
} from "@/types/notification";
import { isNotificationAllowed } from "@/lib/notifications/preferencesLogic";

export const USER_NOTIFICATIONS_COLLECTION = "userNotifications";
export const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";

function normalizeUserNotification(
  id: string,
  data: FirebaseFirestore.DocumentData
): UserNotification {
  return {
    id,
    userId: String(data.userId ?? ""),
    type: (data.type as NotificationType) ?? "system",
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    link: data.link ? String(data.link) : undefined,
    read: Boolean(data.read),
    createdAt: String(data.createdAt ?? ""),
  };
}

function normalizeAdminNotification(
  id: string,
  data: FirebaseFirestore.DocumentData
): AdminNotification {
  return {
    id,
    type: (data.type as AdminNotification["type"]) ?? "system",
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    link: data.link ? String(data.link) : undefined,
    read: Boolean(data.read),
    createdAt: String(data.createdAt ?? ""),
  };
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const db = getAdminFirestore();
  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return DEFAULT_NOTIFICATION_PREFERENCES;
  const prefs = doc.data()?.notificationPreferences;
  if (!prefs || typeof prefs !== "object") return DEFAULT_NOTIFICATION_PREFERENCES;
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const db = getAdminFirestore();
  const current = await getNotificationPreferences(userId);
  const updated = { ...current, ...patch };
  await db.collection("users").doc(userId).set(
    { notificationPreferences: updated, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return updated;
}

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<UserNotification> {
  const db = getAdminFirestore();
  const ref = db.collection(USER_NOTIFICATIONS_COLLECTION).doc();
  const record: UserNotification = {
    id: ref.id,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await ref.set(record);
  return record;
}

export async function listUserNotifications(
  userId: string,
  limit = 30
): Promise<UserNotification[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", userId)
    .limit(Math.min(limit, 100))
    .get();
  return snap.docs
    .map((doc) => normalizeUserNotification(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection(USER_NOTIFICATIONS_COLLECTION).doc(notificationId);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error("Notification not found");
  }
  await ref.update({ read: true });
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(USER_NOTIFICATIONS_COLLECTION)
    .where("userId", "==", userId)
    .where("read", "==", false)
    .limit(100)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
  await batch.commit();
}

export async function createAdminNotification(input: {
  type: AdminNotification["type"];
  title: string;
  body: string;
  link?: string;
}): Promise<AdminNotification> {
  const db = getAdminFirestore();
  const ref = db.collection(ADMIN_NOTIFICATIONS_COLLECTION).doc();
  const record: AdminNotification = {
    id: ref.id,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await ref.set(record);
  return record;
}

export async function listAdminNotifications(limit = 50): Promise<AdminNotification[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(ADMIN_NOTIFICATIONS_COLLECTION)
    .limit(Math.min(limit, 100))
    .get();
  return snap.docs
    .map((doc) => normalizeAdminNotification(doc.id, doc.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(ADMIN_NOTIFICATIONS_COLLECTION).doc(id).update({ read: true });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(ADMIN_NOTIFICATIONS_COLLECTION)
    .where("read", "==", false)
    .limit(100)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
  await batch.commit();
}

export async function notifyUserIfAllowed(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<UserNotification | null> {
  const prefs = await getNotificationPreferences(input.userId);
  if (!isNotificationAllowed(input.type, prefs)) return null;
  return createUserNotification(input);
}

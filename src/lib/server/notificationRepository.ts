import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
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

function mapUserNotification(row: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}): UserNotification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    link: row.link ?? undefined,
    read: row.read,
    createdAt: row.createdAt,
  };
}

function mapAdminNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}): AdminNotification {
  return {
    id: row.id,
    type: row.type as AdminNotification["type"],
    title: row.title,
    body: row.body,
    link: row.link ?? undefined,
    read: row.read,
    createdAt: row.createdAt,
  };
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.notificationPreferences) return DEFAULT_NOTIFICATION_PREFERENCES;
  const prefs = user.notificationPreferences as Partial<NotificationPreferences>;
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(userId);
  const updated = { ...current, ...patch };
  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: asJsonValue(updated),
      updatedAt: new Date().toISOString(),
    },
  });
  return updated;
}

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<UserNotification> {
  const record: UserNotification = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await prisma.userNotification.create({
    data: {
      id: record.id,
      userId: record.userId,
      type: record.type,
      title: record.title,
      body: record.body,
      link: record.link ?? null,
      read: record.read,
      createdAt: record.createdAt,
    },
  });

  return record;
}

export async function listUserNotifications(
  userId: string,
  limit = 30
): Promise<UserNotification[]> {
  const rows = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
  return rows.map(mapUserNotification);
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const row = await prisma.userNotification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!row) throw new Error("Notification not found");
  await prisma.userNotification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function createAdminNotification(input: {
  type: AdminNotification["type"];
  title: string;
  body: string;
  link?: string;
}): Promise<AdminNotification> {
  const record: AdminNotification = {
    id: randomUUID(),
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await prisma.adminNotification.create({
    data: {
      id: record.id,
      type: record.type,
      title: record.title,
      body: record.body,
      link: record.link ?? null,
      read: record.read,
      createdAt: record.createdAt,
    },
  });

  return record;
}

export async function listAdminNotifications(limit = 50): Promise<AdminNotification[]> {
  const rows = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
  return rows.map(mapAdminNotification);
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  await prisma.adminNotification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { read: false },
    data: { read: true },
  });
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

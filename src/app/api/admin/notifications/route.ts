import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/server/notificationRepository";
import { adminNotificationMarkSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("dashboard:read");
    const notifications = await listAdminNotifications();
    const unreadCount = notifications.filter((item) => !item.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin("dashboard:read", request);
    const parsed = adminNotificationMarkSchema.parse(await request.json());

    if (parsed.markAllRead) {
      await markAllAdminNotificationsRead();
      return NextResponse.json({ ok: true });
    }

    await markAdminNotificationRead(parsed.id!);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/server/notificationRepository";

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
    const body = await request.json();

    if (body.markAllRead) {
      await markAllAdminNotificationsRead();
      return NextResponse.json({ ok: true });
    }

    if (typeof body.id === "string") {
      await markAdminNotificationRead(body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

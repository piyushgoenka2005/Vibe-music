import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteAdminNotification,
  listAdminNotificationsPage,
  countUnreadAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/server/notificationRepository";
import { adminNotificationMarkSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("dashboard:read");
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const type =
      typeParam === "ticket" ||
      typeParam === "return" ||
      typeParam === "contact" ||
      typeParam === "order" ||
      typeParam === "system" ||
      typeParam === "rental"
        ? typeParam
        : undefined;
    const page = await listAdminNotificationsPage({
      type,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    const unreadCount = await countUnreadAdminNotifications();
    return NextResponse.json({
      notifications: page.notifications,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      unreadCount,
    });
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

export async function DELETE(request: Request) {
  try {
    await requireAdmin("dashboard:read", request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Notification id required" }, { status: 400 });
    }
    await deleteAdminNotification(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

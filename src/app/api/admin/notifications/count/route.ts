import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { countUnreadAdminNotifications } from "@/lib/server/notificationRepository";

/**
 * Minimal payload for sidebar/bell badge polling. The full notification list
 * lives behind GET /api/admin/notifications and is only fetched by that page.
 */
export async function GET() {
  try {
    await requireAdmin("dashboard:read");
    const unreadCount = await countUnreadAdminNotifications();
    return NextResponse.json(
      { unreadCount },
      {
        headers: {
          // Polled endpoint — never cache an unread count.
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

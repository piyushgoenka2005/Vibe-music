import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  getNotificationPreferences,
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  updateNotificationPreferences,
} from "@/lib/server/notificationRepository";
import {
  markNotificationReadSchema,
  notificationPreferencesSchema,
} from "@/lib/validations/wrFeatures";
import { enforceRateLimit, parseJsonBody } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-notifications", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [notifications, preferences] = await Promise.all([
      listUserNotifications(sessionUser.uid),
      getNotificationPreferences(sessionUser.uid),
    ]);

    const unreadCount = notifications.filter((item) => !item.read).length;
    return NextResponse.json({ notifications, preferences, unreadCount });
  } catch (error) {
    return publicApiError(error, "Failed to load notifications");
  }
}

export async function PUT(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-notifications", RATE_LIMITS.auth);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, notificationPreferencesSchema);
    if ("error" in parsed) return parsed.error;

    const preferences = await updateNotificationPreferences(sessionUser.uid, parsed.data);
    return NextResponse.json({ preferences });
  } catch (error) {
    return publicApiError(error, "Failed to update preferences");
  }
}

export async function PATCH(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "account-notifications", RATE_LIMITS.auth);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, markNotificationReadSchema);
    if ("error" in parsed) return parsed.error;

    if (parsed.data.markAllRead || !parsed.data.id) {
      await markAllUserNotificationsRead(sessionUser.uid);
      return NextResponse.json({ ok: true });
    }

    await markUserNotificationRead(sessionUser.uid, parsed.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicApiError(error, "Failed to mark notification");
  }
}

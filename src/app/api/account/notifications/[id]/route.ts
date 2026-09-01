import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { markUserNotificationRead } from "@/lib/server/notificationRepository";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rl = await enforceRateLimit(request, "account-notifications-id", RATE_LIMITS.auth);
    if (rl) return rl;
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    await markUserNotificationRead(sessionUser.uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicApiError(error, "Failed to delete notification");
  }
}

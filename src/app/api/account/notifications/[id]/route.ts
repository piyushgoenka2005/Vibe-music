import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { markUserNotificationRead } from "@/lib/server/notificationRepository";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await markUserNotificationRead(sessionUser.uid, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
}

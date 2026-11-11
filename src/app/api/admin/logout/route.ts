import { NextResponse } from "next/server";
import { AUTHJS_SESSION_COOKIE, AUTHJS_SESSION_COOKIE_SECURE } from "@/lib/auth/session-config";
import { getSessionUser } from "@/lib/auth/server-session";
import { logAuditEvent } from "@/lib/server/auditLog";

export async function POST() {
  try {
    const user = await getSessionUser().catch(() => null);
    if (user?.uid) {
      void logAuditEvent({
        action: "auth.session_deleted",
        actorId: user.uid,
        resourceType: "session",
        metadata: { via: "admin_logout" },
      });
    }

    const response = NextResponse.json({ ok: true });

    // Expire both the secure and plaintext auth session cookies
    response.cookies.set(AUTHJS_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.set(AUTHJS_SESSION_COOKIE_SECURE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}

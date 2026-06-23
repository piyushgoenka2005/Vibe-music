import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/protected-routes";
import { createSessionCookie, invalidateSessionCache } from "@/lib/auth/server-session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { linkGuestOrdersToUser } from "@/lib/server/orderService";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "auth-session", RATE_LIMITS.auth);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken?.trim();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await createSessionCookie(idToken);

    if (decoded.uid && decoded.email) {
      void linkGuestOrdersToUser(decoded.uid, decoded.email).catch(() => undefined);
    }

    invalidateSessionCache(sessionCookie);

    void logAuditEvent({
      action: "auth.session_created",
      actorId: decoded.uid,
      actorEmail: decoded.email ?? undefined,
      resourceType: "session",
      request,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error && /Missing Firebase Admin env vars/i.test(error.message)
        ? "Firebase Admin is not configured on the server."
        : "Invalid token";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "auth-session", RATE_LIMITS.auth);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    invalidateSessionCache();

    void logAuditEvent({
      action: "auth.session_deleted",
      resourceType: "session",
      request,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleRouteError(error, "api/auth/session DELETE", request);
  }
}

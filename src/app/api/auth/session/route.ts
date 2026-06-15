import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/protected-routes";
import { createSessionCookie } from "@/lib/auth/server-session";
import { getAdminAuth } from "@/lib/firebase/admin";
import { linkGuestOrdersToUser } from "@/lib/server/orderService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };
    const idToken = body.idToken?.trim();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await createSessionCookie(idToken);

    if (decoded.uid && decoded.email) {
      await linkGuestOrdersToUser(decoded.uid, decoded.email).catch((error) => {
        console.error("[auth/session] Failed to link guest orders:", error);
      });
    }

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
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
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
}

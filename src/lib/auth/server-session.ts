import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/protected-routes";

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: AUTH_SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function verifySessionCookie(
  sessionCookie: string | undefined
): Promise<boolean> {
  if (!sessionCookie) return false;

  try {
    await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}

export async function getSessionCookieFromStore(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_SESSION_COOKIE)?.value;
}

export async function isAuthenticatedRequest(): Promise<boolean> {
  const sessionCookie = await getSessionCookieFromStore();
  return verifySessionCookie(sessionCookie);
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionCookie = await getSessionCookieFromStore();
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
    };
  } catch {
    return null;
  }
}

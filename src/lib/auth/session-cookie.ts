import {
  AUTHJS_SESSION_COOKIE,
  AUTHJS_SESSION_COOKIE_SECURE,
} from "@/lib/auth/session-config";

export function isSessionCookiePlausible(sessionCookie: string | undefined): boolean {
  if (!sessionCookie || sessionCookie.length < 16) {
    return false;
  }

  // Auth.js database/JWT session tokens are opaque strings — presence is enough for edge routing.
  return true;
}

export function hasAuthSessionCookie(
  cookies: { get: (name: string) => { value: string } | undefined },
  secure: boolean
): boolean {
  const primary = secure ? AUTHJS_SESSION_COOKIE_SECURE : AUTHJS_SESSION_COOKIE;
  const fallback = secure ? AUTHJS_SESSION_COOKIE : AUTHJS_SESSION_COOKIE_SECURE;
  const value = cookies.get(primary)?.value ?? cookies.get(fallback)?.value;
  return isSessionCookiePlausible(value);
}

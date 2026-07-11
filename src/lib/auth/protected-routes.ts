import { ROUTES } from "@/lib/routes";
import {
  AUTH_SESSION_REMEMBER_MAX_AGE_SECONDS,
  AUTHJS_SESSION_COOKIE,
  AUTHJS_SESSION_COOKIE_SECURE,
} from "@/lib/auth/session-config";

/** @deprecated Auth.js session cookie (dev). */
export const AUTH_SESSION_COOKIE = AUTHJS_SESSION_COOKIE;

/** @deprecated Auth.js session cookie (secure production). */
export const AUTH_SESSION_COOKIE_SECURE = AUTHJS_SESSION_COOKIE_SECURE;

/** Maximum session lifetime when "Remember me" is enabled. */
export const AUTH_SESSION_MAX_AGE_SECONDS = AUTH_SESSION_REMEMBER_MAX_AGE_SECONDS;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.account,
  ROUTES.admin,
] as const;

export const AUTH_GUEST_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
] as const;

/** @deprecated Use AUTH_GUEST_ROUTES */
export const AUTH_PUBLIC_ROUTES = AUTH_GUEST_ROUTES;

export function isGuestAuthRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return AUTH_GUEST_ROUTES.includes(path as (typeof AUTH_GUEST_ROUTES)[number]);
}

export function isProtectedRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (isGuestAuthRoute(path)) {
    return false;
  }

  // Admin login is public; other admin routes require session
  if (path === ROUTES.adminLogin) {
    return false;
  }

  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function getLoginRedirectUrl(requestedPath: string): string {
  const params = new URLSearchParams({ redirect: requestedPath });
  return `${ROUTES.login}?${params.toString()}`;
}

export function getProtectedLoginRedirectUrl(requestedPath: string): string {
  const path = requestedPath.replace(/\/+$/, "") || "/";

  if (
    (path === ROUTES.admin || path.startsWith(`${ROUTES.admin}/`)) &&
    path !== ROUTES.adminLogin
  ) {
    const params = new URLSearchParams({ redirect: requestedPath });
    return `${ROUTES.adminLogin}?${params.toString()}`;
  }

  return getLoginRedirectUrl(requestedPath);
}

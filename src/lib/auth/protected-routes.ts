import { ROUTES } from "@/lib/routes";

export const AUTH_SESSION_COOKIE = "__session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.account,
  ROUTES.admin,
] as const;

export const AUTH_GUEST_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
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

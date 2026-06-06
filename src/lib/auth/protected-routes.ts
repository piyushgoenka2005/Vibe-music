import { ROUTES } from "@/lib/routes";

export const AUTH_SESSION_COOKIE = "__session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.account,
  ROUTES.admin,
  ROUTES.checkout,
] as const;

export const AUTH_PUBLIC_ROUTES = [ROUTES.login, ROUTES.register] as const;

export function isProtectedRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (AUTH_PUBLIC_ROUTES.includes(path as (typeof AUTH_PUBLIC_ROUTES)[number])) {
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

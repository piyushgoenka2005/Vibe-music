import { ROUTES } from "@/lib/routes";

/** Exact account route matching — avoids `/account` matching every sub-route. */
export function isAccountNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.account) {
    return pathname === ROUTES.account;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

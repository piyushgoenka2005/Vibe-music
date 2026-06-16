import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  getLoginRedirectUrl,
  isProtectedRoute,
} from "@/lib/auth/protected-routes";
import { resolveLegacyPath } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const resolved = resolveLegacyPath(pathname);
  if (resolved) {
    return NextResponse.redirect(new URL(resolved, request.url));
  }

  if (isProtectedRoute(pathname)) {
    const sessionCookie = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(
        new URL(getLoginRedirectUrl(pathname), request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/session|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)",
  ],
};

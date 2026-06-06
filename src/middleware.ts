import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveLegacyPath } from "@/lib/routes";

export function middleware(request: NextRequest) {
  const resolved = resolveLegacyPath(request.nextUrl.pathname);
  if (!resolved) {
    return NextResponse.next();
  }

  const target = new URL(resolved, request.url);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)",
  ],
};

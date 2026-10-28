import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProtectedLoginRedirectUrl, isProtectedRoute } from "@/lib/auth/protected-routes";
import { hasAuthSessionCookie, hasAdminSessionCookie } from "@/lib/auth/session-cookie";
import { resolveLegacyPath } from "@/lib/routes";
import { resolveAdLandingRedirect } from "@/lib/seo/adLanding";
import { edgeCheckRateLimit } from "@/lib/security/edge-rate-limit";
import { API_PROXY_CACHE_HEADER, API_SECURITY_HEADERS } from "@/lib/security/headers";
import {
  isMutationMethod,
  isWebhookPath,
  verifyMutationOrigin,
} from "@/lib/security/mutation-origin";
import {
  getClientIp,
  isInternalServerIp,
  type RateLimitResult,
} from "@/lib/security/rate-limit-core";
import { resolveRateLimitScope } from "@/lib/security/rate-limit-scopes";
import {
  finalizeRouteObservationFromStatus,
  REQUEST_START_HEADER,
} from "@/lib/api/route-observation";
import {
  createRequestId,
  logRequestStart,
  logSecurityEvent,
  REQUEST_ID_HEADER,
} from "@/lib/security/request-log";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const header of API_SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }
  return response;
}

function jsonApiError(
  requestId: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
): NextResponse {
  const response = NextResponse.json({ error: message }, { status });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(API_PROXY_CACHE_HEADER.key, API_PROXY_CACHE_HEADER.value);
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      response.headers.set(key, value);
    }
  }
  return withSecurityHeaders(response);
}

/** Internal fast paths that don't need edge rate limit / Redis overhead */
function isApiFastPath(request: NextRequest, pathname: string): boolean {
  // Always fast-path these regardless of auth
  const alwaysFastPaths = [
    "/api/media/thumb",
    "/api/storefront/version",
    "/api/vitals",
    "/api/health",
    "/api/healthz",
    "/api/readyz",
    "/api/auth/session",
    "/api/checkout/capabilities",
    "/api/coupons/active",
  ];
  if (alwaysFastPaths.some((p) => pathname.startsWith(p))) return true;

  // Admin API routes: skip edge rate limit if user has valid admin session cookie.
  // Admin routes are already protected by session auth + requireAdmin() permission guards.
  // This applies to ALL methods (GET, POST, PUT, DELETE, PATCH) so admin writes/updates
  // don't get throttled at the public IP layer.
  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";

  if (pathname.startsWith("/api/admin/")) {
    if (hasAdminSessionCookie(request.cookies, isHttps)) {
      return true;
    }
  }

  // Non-production: skip rate limit for auth/admin routes when explicitly disabled or in development
  if (
    process.env.NODE_ENV !== "production" &&
    (process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV === "development") &&
    (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/admin/"))
  ) {
    return true;
  }

  if (request.method !== "GET") return false;

  // Authenticated user account read routes: skip edge rate limit overhead when session cookie is present
  const accountGetPaths = [
    "/api/account/",
    "/api/orders",
    "/api/addresses",
    "/api/support/tickets",
  ];
  if (accountGetPaths.some((p) => pathname.startsWith(p))) {
    if (hasAuthSessionCookie(request.cookies, isHttps)) {
      return true;
    }
  }

  return false;
}

async function handleApiRequest(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  if (isApiFastPath(request, pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? createRequestId();
  const ip = getClientIp(request);
  const startedAt = Date.now();

  logRequestStart({
    requestId,
    method: request.method,
    path: pathname,
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
    scope: "api",
  });

  const { scope, options } = resolveRateLimitScope(pathname);
  let rateLimit: RateLimitResult = {
    allowed: true,
    remaining: options.limit,
    resetAt: Date.now() + options.windowMs,
  };
  if (isInternalServerIp(ip)) {
    // Loopback / server-internal processes (smoke tests, PM2, local health checks) never self-throttle
  } else if (
    (process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV === "development") &&
    process.env.NODE_ENV !== "production"
  ) {
    // Rate limits intentionally skipped in non-production only.
  } else {
    rateLimit = await edgeCheckRateLimit(`${scope}:${ip}`, options);
    if (!rateLimit.allowed) {
      logSecurityEvent("rate_limit_exceeded", { requestId, path: pathname, ip, scope });
      const blocked = jsonApiError(requestId, "Too many requests. Please try again later.", 429, {
        "X-RateLimit-Limit": String(options.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      });
      finalizeRouteObservationFromStatus(request, 429, startedAt);
      return blocked;
    }
  }

  if (isMutationMethod(request.method) && !isWebhookPath(pathname)) {
    if (!verifyMutationOrigin(request)) {
      logSecurityEvent("csrf_blocked", { requestId, path: pathname, ip });
      const blocked = jsonApiError(requestId, "Invalid request origin", 403);
      finalizeRouteObservationFromStatus(request, 403, startedAt);
      return blocked;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set(REQUEST_START_HEADER, String(startedAt));
  requestHeaders.set("X-RateLimit-Checked", "1");

  const response = withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("X-RateLimit-Limit", String(options.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
  return response;
}

function handleProtectedPage(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedRoute(pathname)) {
    return null;
  }

  const secure =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  if (!hasAuthSessionCookie(request.cookies, secure)) {
    logSecurityEvent("session_rejected", {
      path: pathname,
      ip: getClientIp(request),
      reason: "missing",
    });
    return NextResponse.redirect(new URL(getProtectedLoginRedirectUrl(pathname), request.url));
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const resolved = resolveLegacyPath(pathname);
  if (resolved) {
    return NextResponse.redirect(new URL(resolved, request.url));
  }

  const adLanding = resolveAdLandingRedirect(pathname, request.nextUrl.searchParams);
  if (adLanding) {
    return NextResponse.redirect(new URL(adLanding, request.url), 308);
  }

  if (pathname.startsWith("/api/")) {
    return handleApiRequest(request);
  }

  const protectedResponse = handleProtectedPage(request);
  if (protectedResponse) {
    return protectedResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)",
  ],
};

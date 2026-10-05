import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProtectedLoginRedirectUrl, isProtectedRoute } from "@/lib/auth/protected-routes";
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie";
import { resolveLegacyPath } from "@/lib/routes";
import { edgeCheckRateLimit } from "@/lib/security/edge-rate-limit";
import { API_SECURITY_HEADERS } from "@/lib/security/headers";
import {
  isMutationMethod,
  isWebhookPath,
  verifyMutationOrigin,
} from "@/lib/security/mutation-origin";
import { getClientIp, type RateLimitResult } from "@/lib/security/rate-limit-core";
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

function withSecurityHeaders(response: NextResponse, pathname?: string): NextResponse {
  for (const header of API_SECURITY_HEADERS) {
    if (header.key === "Cache-Control" && pathname?.startsWith("/api/media/thumb")) {
      continue;
    }
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
  if (extraHeaders) {
    for (const [key, value] of Object.entries(extraHeaders)) {
      response.headers.set(key, value);
    }
  }
  return withSecurityHeaders(response);
}

function isDevAuthReadFastPath(request: NextRequest, pathname: string): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DISABLE_RATE_LIMIT === "true" &&
    request.method === "GET" &&
    (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/admin/"))
  );
}

/** Thumb route enforces its own limits; skip edge Redis round-trip on hot image reads. */
function isMediaThumbReadFastPath(request: NextRequest, pathname: string): boolean {
  return request.method === "GET" && pathname.startsWith("/api/media/thumb");
}

async function handleApiRequest(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  if (isDevAuthReadFastPath(request, pathname) || isMediaThumbReadFastPath(request, pathname)) {
    return withSecurityHeaders(NextResponse.next(), pathname);
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
  if (process.env.DISABLE_RATE_LIMIT === "true" && process.env.NODE_ENV !== "production") {
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

  const response = withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    pathname,
  );
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

  const secure = request.nextUrl.protocol === "https:";
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

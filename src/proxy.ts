import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getProtectedLoginRedirectUrl,
  isProtectedRoute,
} from "@/lib/auth/protected-routes";
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie";
import { resolveLegacyPath } from "@/lib/routes";
import { edgeCheckRateLimit } from "@/lib/security/edge-rate-limit";
import { API_SECURITY_HEADERS } from "@/lib/security/headers";
import {
  isMutationMethod,
  isWebhookPath,
  verifyMutationOrigin,
} from "@/lib/security/mutation-origin";
import { getClientIp, RATE_LIMITS, type RateLimitResult } from "@/lib/security/rate-limit-core";
import {
  createRequestId,
  logRequestStart,
  logSecurityEvent,
  REQUEST_ID_HEADER,
} from "@/lib/security/request-log";

function resolveRateLimitScope(pathname: string): {
  scope: string;
  options: (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];
} {
  if (pathname === "/api/health") {
    return { scope: "health", options: RATE_LIMITS.health };
  }
  if (pathname.startsWith("/api/admin")) {
    return { scope: "admin-api", options: RATE_LIMITS.admin };
  }
  if (pathname.startsWith("/api/auth")) {
    return { scope: "auth-api", options: RATE_LIMITS.auth };
  }
  if (pathname.startsWith("/api/payment") || pathname.startsWith("/api/orders")) {
    return { scope: "checkout-api", options: RATE_LIMITS.checkout };
  }
  if (pathname.startsWith("/api/search")) {
    return { scope: "search-api", options: RATE_LIMITS.search };
  }
  if (pathname.startsWith("/api/media/thumb")) {
    return { scope: "media-thumb", options: RATE_LIMITS.mediaThumb };
  }
  return { scope: "public-api", options: RATE_LIMITS.publicApi };
}

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
  extraHeaders?: Record<string, string>
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

async function handleApiRequest(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? createRequestId();
  const ip = getClientIp(request);

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
      return jsonApiError(requestId, "Too many requests. Please try again later.", 429, {
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      });
    }
  }

  if (isMutationMethod(request.method) && !isWebhookPath(pathname)) {
    if (!verifyMutationOrigin(request)) {
      logSecurityEvent("csrf_blocked", { requestId, path: pathname, ip });
      return jsonApiError(requestId, "Invalid request origin", 403);
    }
  }

  const response = withSecurityHeaders(NextResponse.next());
  response.headers.set(REQUEST_ID_HEADER, requestId);
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
    return NextResponse.redirect(
      new URL(getProtectedLoginRedirectUrl(pathname), request.url)
    );
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

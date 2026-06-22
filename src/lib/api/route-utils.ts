import { NextResponse } from "next/server";
import { z } from "zod";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
import {
  getClientIp,
  RATE_LIMITS,
  type RateLimitOptions,
} from "@/lib/security/rate-limit";
import {
  isMutationMethod,
  isWebhookPath,
  verifyMutationOrigin,
} from "@/lib/security/mutation-origin";
import { getRequestId } from "@/lib/security/request-log";
import { reportServerError } from "@/lib/server/errorMonitoring";
import { logInfo } from "@/lib/server/logger";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return jsonError(`${resource} not found`, 404);
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: { remaining: number; resetAt: number }
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));
  return response;
}

export function applyRequestIdHeader(
  response: NextResponse,
  request: Request
): NextResponse {
  response.headers.set("x-request-id", getRequestId(request));
  return response;
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions = RATE_LIMITS.publicApi
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await distributedCheckRateLimit(`${scope}:${ip}`, options);
  if (!result.allowed) {
    const response = jsonError("Too many requests. Please try again later.", 429);
    return applyRateLimitHeaders(applyRequestIdHeader(response, request), result);
  }
  return null;
}

export function enforceMutationSecurity(request: Request): NextResponse | null {
  if (!isMutationMethod(request.method)) {
    return null;
  }

  const { pathname } = new URL(request.url);
  if (isWebhookPath(pathname)) {
    return null;
  }

  if (!verifyMutationOrigin(request)) {
    return applyRequestIdHeader(
      jsonError("Invalid request origin", 403),
      request
    );
  }
  return null;
}

export function logApiRequest(
  request: Request,
  context: string,
  meta?: Record<string, unknown>
): void {
  const { pathname } = new URL(request.url);
  logInfo("API request", context, {
    requestId: getRequestId(request),
    method: request.method,
    path: pathname,
    ip: getClientIp(request),
    ...meta,
  });
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: applyRequestIdHeader(
          jsonError(
            error.issues.map((issue) => issue.message).join("; "),
            400
          ),
          request
        ),
      };
    }
    return {
      error: applyRequestIdHeader(jsonError("Invalid JSON body", 400), request),
    };
  }
}

export function handleRouteError(
  error: unknown,
  context: string,
  request?: Request
): NextResponse {
  reportServerError(error, {
    source: context,
    requestId: request ? getRequestId(request) : undefined,
    routePath: request ? new URL(request.url).pathname : undefined,
  });
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status = message.toLowerCase().includes("not found")
    ? 404
    : message.includes("denied") || message.includes("permission")
      ? 403
      : 500;
  const response = jsonError(
    status === 500 ? "Internal server error" : message,
    status
  );
  return request ? applyRequestIdHeader(response, request) : response;
}

export async function withApiGuards(
  request: Request,
  options: {
    context: string;
    scope: string;
    rateLimit?: RateLimitOptions;
    requireCsrf?: boolean;
  },
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  logApiRequest(request, options.context);

  const rateLimited = await enforceRateLimit(
    request,
    options.scope,
    options.rateLimit ?? RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  if (options.requireCsrf !== false) {
    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;
  }

  try {
    const response = await handler();
    return applyRequestIdHeader(response, request);
  } catch (error) {
    return handleRouteError(error, options.context, request);
  }
}

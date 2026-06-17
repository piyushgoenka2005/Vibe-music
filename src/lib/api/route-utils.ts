import { NextResponse } from "next/server";
import { z } from "zod";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
import {
  getClientIp,
  RATE_LIMITS,
  type RateLimitOptions,
} from "@/lib/security/rate-limit";
import { verifyMutationOrigin } from "@/lib/security/csrf";
import { logError } from "@/lib/server/logger";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: { remaining: number; resetAt: number }
): NextResponse {
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));
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
    return applyRateLimitHeaders(response, result);
  }
  return null;
}

export function enforceMutationSecurity(request: Request): NextResponse | null {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }
  if (!verifyMutationOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  return null;
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
        error: jsonError(
          error.issues.map((issue) => issue.message).join("; "),
          400
        ),
      };
    }
    return { error: jsonError("Invalid JSON body", 400) };
  }
}

export function handleRouteError(
  error: unknown,
  context: string
): NextResponse {
  logError("Route handler failed", error, context);
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status = message.includes("not found")
    ? 404
    : message.includes("denied") || message.includes("permission")
      ? 403
      : 500;
  return jsonError(message, status);
}

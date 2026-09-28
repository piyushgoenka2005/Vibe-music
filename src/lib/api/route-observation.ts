import type { NextResponse } from "next/server";
import { getClientIp } from "@/lib/security/rate-limit-core";
import { logRequestEnd, type RequestLogEntry } from "@/lib/security/request-log";
import { recordRequest } from "@/lib/server/requestMetrics";

export const REQUEST_START_HEADER = "x-request-start";

function requestStartMs(request: Request): number | null {
  const raw = request.headers.get(REQUEST_START_HEADER);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildLogEntry(request: Request, status: number, durationMs: number): RequestLogEntry {
  const { pathname } = new URL(request.url);
  return {
    requestId: request.headers.get("x-request-id") ?? "unknown",
    method: request.method,
    path: pathname,
    ip: getClientIp(request),
    status,
    durationMs,
    scope: "api",
  };
}

/** Record RED metrics + structured request.end log (idempotent per request). */
export function finalizeRouteObservation(
  request: Request,
  response: Response,
  startedAt?: number,
): void {
  const start = startedAt ?? requestStartMs(request);
  if (start === null) return;

  const durationMs = Math.max(0, Date.now() - start);
  const status = response.status;

  try {
    recordRequest(status, durationMs);
  } catch {
    /* non-fatal */
  }

  try {
    logRequestEnd(buildLogEntry(request, status, durationMs));
  } catch {
    /* non-fatal */
  }
}

export function finalizeRouteObservationFromStatus(
  request: Request,
  status: number,
  startedAt: number,
): void {
  finalizeRouteObservation(request, new Response(null, { status }), startedAt);
}

/** Wrap a route handler to always emit request.end metrics. */
export function observeRouteHandler<T extends Request>(
  handler: (request: T, ...args: unknown[]) => Promise<NextResponse>,
): (request: T, ...args: unknown[]) => Promise<NextResponse> {
  return async (request: T, ...args: unknown[]) => {
    const startedAt = requestStartMs(request) ?? Date.now();
    try {
      const response = await handler(request, ...args);
      finalizeRouteObservation(request, response, startedAt);
      return response;
    } catch (error) {
      finalizeRouteObservationFromStatus(request, 500, startedAt);
      throw error;
    }
  };
}

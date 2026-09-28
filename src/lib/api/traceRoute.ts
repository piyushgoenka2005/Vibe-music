import type { NextResponse } from "next/server";
import { finalizeRouteObservation } from "@/lib/api/route-observation";
import { traceSpan } from "@/lib/server/tracing";

/**
 * Wrap an App Router handler with OpenTelemetry + request.end observation.
 */
export function traceRouteHandler(
  routeName: string,
  handler: (request: Request, ...args: unknown[]) => Promise<NextResponse>,
): (request: Request, ...args: unknown[]) => Promise<NextResponse> {
  return async (request: Request, ...args: unknown[]) => {
    const startedAt = Date.now();

    try {
      return await traceSpan(
        `http.route`,
        async (span) => {
          span.setAttribute("http.route", routeName);
          span.setAttribute("http.method", request.method);
          const response = await handler(request, ...args);
          span.setAttribute("http.status_code", response.status);
          finalizeRouteObservation(request, response, startedAt);
          return response;
        },
        { "http.route": routeName },
      );
    } catch (error) {
      finalizeRouteObservation(request, new Response(null, { status: 500 }), startedAt);
      throw error;
    }
  };
}

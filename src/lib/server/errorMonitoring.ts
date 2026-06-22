import "server-only";

import { logError } from "@/lib/server/logger";

export interface ErrorMonitoringContext {
  source: string;
  routePath?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export function reportServerError(
  error: Error,
  context: ErrorMonitoringContext
): void {
  logError(
    `Server error from ${context.source}`,
    error,
    context.source,
    context.meta
  );

  // Optional: Send to external error tracking service (Sentry, etc.)
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, { tags: context });
  // }
}

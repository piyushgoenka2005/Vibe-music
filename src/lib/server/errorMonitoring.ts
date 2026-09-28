import "server-only";

import { logError } from "@/lib/server/logger";

export interface ServerErrorContext {
  source: string;
  routePath?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export type ErrorMonitoringContext = ServerErrorContext;

const reportedErrors = new Set<string>();
const MAX_TRACKED_ERRORS = 200;

function trackErrorKey(key: string): void {
  reportedErrors.add(key);
  if (reportedErrors.size > MAX_TRACKED_ERRORS) {
    const first = reportedErrors.values().next().value;
    if (first) reportedErrors.delete(first);
  }
}

export function isErrorMonitoringConfigured(): boolean {
  return Boolean(
    process.env.ERROR_MONITORING_WEBHOOK_URL?.trim() || process.env.SENTRY_DSN?.trim(),
  );
}

async function notifyWebhook(error: Error, context: ServerErrorContext): Promise<void> {
  const webhookUrl = process.env.ERROR_MONITORING_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "vibe-music",
        environment: process.env.NODE_ENV ?? "development",
        text: `[${context.source}] ${error.message}`,
        error: {
          message: error.message,
          stack: error.stack,
          routePath: context.routePath,
          requestId: context.requestId,
          meta: context.meta,
        },
        context: {
          source: context.source,
          routePath: context.routePath,
          requestId: context.requestId,
          meta: context.meta,
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* webhook delivery must not throw */
  }
}

/** Operator smoke test — throws when webhook is unset or delivery fails. */
export async function pingErrorMonitoringWebhook(): Promise<void> {
  const webhookUrl = process.env.ERROR_MONITORING_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error("ERROR_MONITORING_WEBHOOK_URL is not configured");
  }

  const probe = new Error("error monitoring ping");
  await notifyWebhook(probe, { source: "ops/error-monitoring-ping" });
}

/**
 * Central server error reporter for instrumentation hooks and API routes.
 */
export function reportServerError(
  error: unknown | Error,
  context: ServerErrorContext | ErrorMonitoringContext,
): void {
  const normalized = error instanceof Error ? error : new Error(String(error ?? "Unknown error"));

  const dedupeKey = [context.source, context.routePath ?? "", normalized.message].join("|");

  if (reportedErrors.has(dedupeKey)) return;
  trackErrorKey(dedupeKey);

  logError(
    `Server error from ${context.source}: ${normalized.message}`,
    normalized,
    context.source,
    {
      routePath: context.routePath,
      requestId: context.requestId,
      ...context.meta,
    },
  );

  void notifyWebhook(normalized, context);
}

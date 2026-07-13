export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/env");
    validateEnv();

    const { getIntegrationChecks } = await import("@/lib/server/integrationConfig");
    const { logWarn } = await import("@/lib/server/logger");
    const integrations = getIntegrationChecks();

    if (process.env.NODE_ENV === "production") {
      if (integrations.upstash !== "ok") {
        logWarn(
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing; using in-memory rate limiting",
          "instrumentation"
        );
      }
      if (integrations.razorpayWebhook !== "ok") {
        logWarn(
          "RAZORPAY_WEBHOOK_SECRET is missing; webhook verification endpoints may fail",
          "instrumentation"
        );
      }
      if (integrations.database !== "ok") {
        logWarn(
          "DATABASE_URL is missing; the application cannot persist data",
          "instrumentation"
        );
      }
    }

    try {
      const { verifyPostgresConnection } = await import(
        "@/lib/server/postgresHealth"
      );
      const databaseHealth = await verifyPostgresConnection();
      if (!databaseHealth.ok && process.env.NODE_ENV === "production") {
        logWarn(
          `PostgreSQL initialization failed at startup: ${databaseHealth.error ?? "unknown"}`,
          "instrumentation"
        );
      }
    } catch (error) {
      logWarn(
        `PostgreSQL health check skipped: ${error instanceof Error ? error.message : String(error)}`,
        "instrumentation"
      );
    }
  }
}

export async function onRequestError(
  error: Error,
  request: Request,
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  }
): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { reportServerError } = await import("@/lib/server/errorMonitoring");
  const { getRequestId } = await import("@/lib/security/request-log");

  reportServerError(error, {
    source: "onRequestError",
    routePath: context.routePath,
    requestId: getRequestId(request),
    meta: {
      routerKind: context.routerKind,
      routeType: context.routeType,
      method: request.method,
      url: request.url,
    },
  });
}

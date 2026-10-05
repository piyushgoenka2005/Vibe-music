export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/env");
    validateEnv();

    if (process.env.NODE_ENV === "production") {
      const { assertProductionSecurityControls } =
        await import("@/lib/server/productionSecurityGuards");
      assertProductionSecurityControls();
    }

    const { getIntegrationChecks } = await import("@/lib/server/integrationConfig");
    const { logWarn } = await import("@/lib/server/logger");
    const integrations = getIntegrationChecks();

    if (process.env.NODE_ENV === "production") {
      if (integrations.upstash !== "ok") {
        logWarn(
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing; using in-memory rate limiting",
          "instrumentation",
        );
      }
      if (integrations.razorpayWebhook !== "ok") {
        logWarn(
          "RAZORPAY_WEBHOOK_SECRET is missing; webhook verification endpoints may fail",
          "instrumentation",
        );
      }
      const { getRazorpayKeyMode, requiresLiveRazorpay } = await import("@/lib/server/env");
      if (requiresLiveRazorpay() && getRazorpayKeyMode() === "test") {
        logWarn(
          "Razorpay test keys detected on production/vibemusic.in — replace with rzp_live_ keys or checkout will refuse payments",
          "instrumentation",
        );
      }
      if (requiresLiveRazorpay() && integrations.razorpay !== "ok") {
        logWarn(
          "Razorpay live keys are not configured; online checkout is unavailable",
          "instrumentation",
        );
      }
      if (integrations.database !== "ok") {
        logWarn("DATABASE_URL is missing; the application cannot persist data", "instrumentation");
      }
      if (!process.env.METRICS_SCRAPE_TOKEN?.trim()) {
        logWarn(
          "METRICS_SCRAPE_TOKEN is unset — /api/metrics is blocked in production until configured",
          "instrumentation",
        );
      }
    }

    if (process.env.NODE_ENV === "production") {
      const { warnIfGooglePlacesMisconfigured } = await import("@/lib/server/googlePlaces");
      warnIfGooglePlacesMisconfigured("instrumentation");
    }

    const { isGoogleAuthConfigured } = await import("@/lib/auth/google-config");
    if (isGoogleAuthConfigured()) {
      void import("@/lib/auth/google-oauth-health")
        .then(({ probeGoogleOAuthClient, formatGoogleOAuthHealthMessage }) =>
          probeGoogleOAuthClient({ bypassCache: true, timeoutMs: 8_000 }).then((oauthHealth) => {
            if (!oauthHealth.ok) {
              logWarn(formatGoogleOAuthHealthMessage(oauthHealth), "instrumentation");
            }
          }),
        )
        .catch(() => {});
    }

    try {
      const { ensureTracingInitialized, isTracingEnabled } = await import("@/lib/server/tracing");
      if (isTracingEnabled()) {
        ensureTracingInitialized();
      }
    } catch (error) {
      logWarn(
        `OpenTelemetry tracing failed to initialize: ${error instanceof Error ? error.message : String(error)}`,
        "instrumentation",
      );
    }

    try {
      const skipStartupProbe =
        process.env.NODE_ENV !== "production" || process.env.SKIP_INSTRUMENTATION_CHECKS === "true";

      if (skipStartupProbe) {
        // Don't block dev server boot on a 3s Postgres probe.
        void import("@/lib/server/postgresHealth")
          .then(({ verifyPostgresConnection }) => verifyPostgresConnection())
          .catch(() => {});
      } else {
        const { verifyPostgresConnection } = await import("@/lib/server/postgresHealth");
        const databaseHealth = await verifyPostgresConnection();
        if (!databaseHealth.ok) {
          logWarn(
            `PostgreSQL initialization failed at startup: ${databaseHealth.error ?? "unknown"}`,
            "instrumentation",
          );
        }
      }
    } catch (error) {
      logWarn(
        `PostgreSQL health check skipped: ${error instanceof Error ? error.message : String(error)}`,
        "instrumentation",
      );
    }

    const { registerGracefulShutdown } = await import("@/lib/server/gracefulShutdown");
    registerGracefulShutdown();
  }
}

export async function onRequestError(
  error: Error,
  request: Request,
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  },
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

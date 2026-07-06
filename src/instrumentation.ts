export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.SKIP_INSTRUMENTATION_CHECKS === "true") {
      return;
    }

    const { validateEnv } = await import("@/env");
    validateEnv();

    const { getIntegrationChecks } = await import("@/lib/server/integrationConfig");
    const integrations = getIntegrationChecks();

    if (process.env.NODE_ENV === "production") {
      const { logWarn } = await import("@/lib/server/logger");
      if (integrations.upstash !== "ok") {
        logWarn(
          "UPSTASH_REDIS_REST_URL/TOKEN missing — using in-memory rate limits",
          "instrumentation"
        );
      }
      if (integrations.razorpayWebhook !== "ok") {
        logWarn(
          "RAZORPAY_WEBHOOK_SECRET missing — webhook verification disabled until configured",
          "instrumentation"
        );
      }
    }

    // Always verify on startup — fail hard in production, degrade gracefully in dev.
    const shouldVerifyFirestoreOnStartup = true;

    if (shouldVerifyFirestoreOnStartup) {
      const { verifyFirestoreConnection } = await import(
        "@/lib/server/firestoreHealth"
      );
      const firestoreHealth = await verifyFirestoreConnection();
      if (!firestoreHealth.ok) {
        const { markFirestoreUnavailable } = await import(
          "@/lib/server/firestoreErrors"
        );
        markFirestoreUnavailable(
          new Error(firestoreHealth.error ?? "Firestore unavailable at startup")
        );
        const { logInfo, logWarn } = await import("@/lib/server/logger");
        const message =
          "Firestore degraded at startup — serving from local JSON / file fallbacks";
        if (process.env.NODE_ENV === "production") {
          logWarn(message, "instrumentation", {
            error: firestoreHealth.error,
            usingLocalFallback: firestoreHealth.usingLocalFallback,
          });
        } else {
          logInfo(message, "instrumentation", {
            error: firestoreHealth.error,
          });
        }
      }
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

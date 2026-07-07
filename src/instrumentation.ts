export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/env");
    validateEnv();

    const { getIntegrationChecks } = await import("@/lib/server/integrationConfig");
    const { logWarn } = await import("@/lib/server/logger");
    const integrations = getIntegrationChecks();

    if (process.env.NODE_ENV === "production") {
      if (integrations.upstash !== "ok") {
        throw new Error(
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production"
        );
      }
      if (integrations.razorpayWebhook !== "ok") {
        throw new Error("RAZORPAY_WEBHOOK_SECRET is required in production");
      }
    }

    const { verifyFirestoreConnection } = await import(
      "@/lib/server/firestoreHealth"
    );
    const firestoreHealth = await verifyFirestoreConnection();
    if (!firestoreHealth.ok && process.env.NODE_ENV === "production") {
      throw new Error(
        `Firestore initialization failed: ${firestoreHealth.error ?? "unknown"}`
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

import { NextResponse } from "next/server";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";
import { verifyFirestoreConnection } from "@/lib/server/firestoreHealth";
import { logInfo } from "@/lib/server/logger";

export async function GET() {
  const timestamp = new Date().toISOString();
  const integrations = getIntegrationChecks();
  const firestoreHealth = await verifyFirestoreConnection();

  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    firestore: firestoreHealth.ok ? "ok" : "error",
  };

  const fullyHealthy = checks.app === "ok" && checks.firestore === "ok";
  const canServeTraffic =
    checks.app === "ok" &&
    (firestoreHealth.ok || firestoreHealth.usingLocalFallback === true);
  const isProduction = process.env.NODE_ENV === "production";
  const body = {
    status: fullyHealthy ? "healthy" : canServeTraffic ? "degraded" : "unhealthy",
    timestamp,
    checks,
    firestore: {
      ok: firestoreHealth.ok,
      usingLocalFallback: firestoreHealth.usingLocalFallback ?? false,
      error: firestoreHealth.error,
    },
    integrations: isProduction ? undefined : integrations,
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };

  logInfo("Health check", "api/health", body);

  return NextResponse.json(body, {
    status: canServeTraffic ? 200 : 503,
  });
}

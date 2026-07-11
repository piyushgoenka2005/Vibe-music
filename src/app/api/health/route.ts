import { NextResponse } from "next/server";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";
import { logInfo } from "@/lib/server/logger";

export async function GET() {
  const timestamp = new Date().toISOString();
  const integrations = getIntegrationChecks();
  const databaseHealth = await verifyPostgresConnection();

  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    database: databaseHealth.ok ? "ok" : "error",
  };

  const fullyHealthy = checks.app === "ok" && checks.database === "ok";
  const canServeTraffic = checks.app === "ok" && databaseHealth.ok;
  const isProduction = process.env.NODE_ENV === "production";
  const body = {
    status: fullyHealthy ? "healthy" : canServeTraffic ? "degraded" : "unhealthy",
    timestamp,
    checks,
    database: {
      ok: databaseHealth.ok,
      error: databaseHealth.error,
    },
    integrations: isProduction ? undefined : integrations,
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };

  logInfo("Health check", "api/health", body);

  return NextResponse.json(body, {
    status: canServeTraffic ? 200 : 503,
  });
}

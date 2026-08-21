import { NextResponse } from "next/server";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";
import { logInfo } from "@/lib/server/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Brief memoization so bursty uptime monitors don't stack DB probes while the
 * pool is cold — the first probe pays connection cost, the rest reuse it.
 */
const HEALTH_CACHE_TTL_MS = 10_000;

type HealthSnapshot = {
  at: number;
  body: Record<string, unknown>;
  status: number;
};

let cached: HealthSnapshot | null = null;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < HEALTH_CACHE_TTL_MS) {
    return NextResponse.json(cached.body, { status: cached.status });
  }

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

  if (!databaseHealth.ok) {
    logInfo("Health check", "api/health", body);
  }

  const snapshot: HealthSnapshot = {
    at: now,
    body,
    status: canServeTraffic ? 200 : 503,
  };
  cached = snapshot;

  return NextResponse.json(body, { status: snapshot.status });
}

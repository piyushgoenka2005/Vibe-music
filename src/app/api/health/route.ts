import { NextResponse } from "next/server";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";
import { logInfo } from "@/lib/server/logger";
import { dbCircuitBreaker, redisCircuitBreaker } from "@/lib/security/circuit-breaker";
import { getBackpressureStats, isSystemUnderPressure } from "@/lib/security/backpressure";
import { getCacheStats } from "@/lib/server/redisCache";

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

  const isProduction = process.env.NODE_ENV === "production";

  // Circuit breaker status
  const dbCircuit = dbCircuitBreaker.getMetrics();
  const redisCircuit = redisCircuitBreaker.getMetrics();

  // Backpressure stats
  const backpressure = getBackpressureStats();
  const underPressure = isSystemUnderPressure();

  // Cache stats
  const cache = getCacheStats();

  // Determine overall status
  const circuitBreakerOk = dbCircuit.state !== "open" && redisCircuit.state !== "open";
  const fullyHealthy = checks.app === "ok" && checks.database === "ok" && circuitBreakerOk && !underPressure;
  const canServeTraffic = checks.app === "ok" && databaseHealth.ok;

  const body = {
    status: fullyHealthy ? "healthy" : canServeTraffic ? "degraded" : "unhealthy",
    timestamp,
    checks,
    database: {
      ok: databaseHealth.ok,
      error: databaseHealth.error,
    },
    circuitBreaker: {
      database: {
        state: dbCircuit.state,
        failures: dbCircuit.failureCount,
        lastStateChange: new Date(dbCircuit.lastStateChange).toISOString(),
      },
      redis: {
        state: redisCircuit.state,
        failures: redisCircuit.failureCount,
        lastStateChange: new Date(redisCircuit.lastStateChange).toISOString(),
      },
    },
    backpressure: {
      underPressure,
      scopes: backpressure,
    },
    cache: {
      memoryEntries: cache.memoryEntries,
      staleEntries: cache.staleEntries,
      inflightRequests: cache.inflightRequests,
    },
    integrations: isProduction ? undefined : integrations,
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    uptime: Math.floor(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
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

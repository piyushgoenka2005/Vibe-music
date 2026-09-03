import { NextResponse } from "next/server";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";
import { getRawPrisma } from "@/lib/db/prisma";
import { dbCircuitBreaker, redisCircuitBreaker } from "@/lib/security/circuit-breaker";
import { getBackpressureStats } from "@/lib/security/backpressure";
import { getCacheStats } from "@/lib/server/redisCache";
import { getRequestMetrics } from "@/lib/server/requestMetrics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Prometheus text format ──

function prometheusLine(name: string, help: string, type: string, lines: string[]): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${lines.join("\n")}\n`;
}

export async function GET() {
  try {
    const now = Date.now();
    const metrics = getRequestMetrics();

    // Database health (bypass circuit breaker for metrics)
    const dbHealth = await verifyPostgresConnection();
    const rawPrisma = getRawPrisma();

    // Count active products (lightweight query)
    let activeProducts = 0;
    let totalOrders = 0;
    if (rawPrisma) {
      try {
        const [productCount, orderCount] = await Promise.all([
          rawPrisma.product.count({ where: { status: "active" } }),
          rawPrisma.order.count(),
        ]);
        activeProducts = productCount;
        totalOrders = orderCount;
      } catch {
        // Non-critical — metrics endpoint should not fail
      }
    }

    // Circuit breaker metrics
    const dbCircuit = dbCircuitBreaker.getMetrics();
    const redisCircuit = redisCircuitBreaker.getMetrics();

    // Backpressure metrics
    const backpressure = getBackpressureStats();

    // Cache metrics
    const cache = getCacheStats();

    // Process metrics
    const memUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    // Build Prometheus text format
    const lines: string[] = [];

    // ── App info ──
    lines.push(
      prometheusLine("vibe_app_info", "Application metadata", "gauge", [
        `{version="${process.env.VERCEL_GIT_COMMIT_SHA ?? "local"}",node="${process.version}"} 1`,
      ]),
    );

    // ── Uptime ──
    lines.push(
      prometheusLine("vibe_uptime_seconds", "Process uptime in seconds", "gauge", [
        String(uptimeSeconds),
      ]),
    );

    // ── Request counts ──
    lines.push(
      prometheusLine(
        "vibe_http_requests_total",
        "Total HTTP requests served since process start",
        "gauge",
        [String(metrics.requestCount)],
      ),
    );

    lines.push(
      prometheusLine("vibe_http_errors_total", "Total 5xx errors since process start", "gauge", [
        String(metrics.errorCount),
      ]),
    );

    lines.push(
      prometheusLine(
        "vibe_http_rate_limit_hits_total",
        "Total 429 rate limit responses since process start",
        "gauge",
        [String(metrics.rateLimitHits)],
      ),
    );

    // ── Status code breakdown ──
    for (const [code, count] of Object.entries(metrics.statusCodes)) {
      lines.push(
        prometheusLine(
          `vibe_http_status_code_total{code="${code}"}`,
          `Total responses with status code ${code}`,
          "gauge",
          [String(count)],
        ),
      );
    }

    // ── Latency percentiles ──
    if (metrics.responseTimes.length > 0) {
      const durationLines = [
        `{quantile="0.5"} ${metrics.percentiles.p50.toFixed(1)}`,
        `{quantile="0.9"} ${metrics.percentiles.p90.toFixed(1)}`,
        `{quantile="0.95"} ${metrics.percentiles.p95.toFixed(1)}`,
        `{quantile="0.99"} ${metrics.percentiles.p99.toFixed(1)}`,
        `{quantile="avg"} ${metrics.percentiles.avg.toFixed(1)}`,
      ];
      lines.push(
        prometheusLine(
          "vibe_http_request_duration_ms",
          "Request latency in milliseconds (sampled)",
          "gauge",
          durationLines,
        ),
      );
    }

    // ── Database ──
    lines.push(
      prometheusLine(
        "vibe_database_healthy",
        "PostgreSQL connection health (1=ok, 0=error)",
        "gauge",
        [dbHealth.ok ? "1" : "0"],
      ),
    );

    lines.push(
      prometheusLine("vibe_products_active", "Number of active products in catalog", "gauge", [
        String(activeProducts),
      ]),
    );

    lines.push(
      prometheusLine("vibe_orders_total", "Total orders in database", "gauge", [
        String(totalOrders),
      ]),
    );

    // ── Memory ──
    lines.push(
      prometheusLine(
        "vibe_process_resident_memory_bytes",
        "Process resident memory in bytes",
        "gauge",
        [String(memUsage.rss)],
      ),
    );

    lines.push(
      prometheusLine("vibe_process_heap_used_bytes", "Process heap used in bytes", "gauge", [
        String(memUsage.heapUsed),
      ]),
    );

    lines.push(
      prometheusLine("vibe_process_heap_total_bytes", "Process heap total in bytes", "gauge", [
        String(memUsage.heapTotal),
      ]),
    );

    // ── Circuit breaker ──
    const circuitStateMap: Record<string, number> = { closed: 0, open: 1, half_open: 2 };
    lines.push(
      prometheusLine(
        "vibe_circuit_breaker_state",
        "Circuit breaker state (0=closed, 1=open, 2=half_open)",
        "gauge",
        [
          `{service="database"} ${circuitStateMap[dbCircuit.state] ?? 0}`,
          `{service="redis"} ${circuitStateMap[redisCircuit.state] ?? 0}`,
        ],
      ),
    );

    lines.push(
      prometheusLine(
        "vibe_circuit_breaker_failures",
        "Recent failures in circuit breaker window",
        "gauge",
        [
          `{service="database"} ${dbCircuit.failureCount}`,
          `{service="redis"} ${redisCircuit.failureCount}`,
        ],
      ),
    );

    // ── Backpressure ──
    for (const scope of backpressure) {
      lines.push(
        prometheusLine(
          `vibe_backpressure_in_flight{scope="${scope.scope}"}`,
          `Current in-flight requests for scope ${scope.scope}`,
          "gauge",
          [String(scope.inFlight)],
        ),
      );
      lines.push(
        prometheusLine(
          `vibe_backpressure_rejected_total{scope="${scope.scope}"}`,
          `Total backpressure rejections for scope ${scope.scope}`,
          "gauge",
          [String(scope.rejected)],
        ),
      );
    }

    // ── Cache ──
    lines.push(
      prometheusLine("vibe_cache_memory_entries", "Number of entries in in-memory cache", "gauge", [
        String(cache.memoryEntries),
      ]),
    );
    lines.push(
      prometheusLine(
        "vibe_cache_stale_entries",
        "Number of stale cache entries (circuit breaker fallback)",
        "gauge",
        [String(cache.staleEntries)],
      ),
    );
    lines.push(
      prometheusLine("vibe_cache_inflight_requests", "Number of in-flight cache fetches", "gauge", [
        String(cache.inflightRequests),
      ]),
    );

    // ── Collect timestamp ──
    lines.push(
      prometheusLine(
        "vibe_metrics_scrape_timestamp",
        "Unix timestamp of last metrics scrape",
        "gauge",
        [String(Math.floor(now / 1000))],
      ),
    );

    const body = lines.join("\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[api/metrics] Error:", error);
    return new NextResponse("# Error generating metrics\n", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

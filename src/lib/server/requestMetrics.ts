import "server-only";

// ─── In-process request metrics (resets on process restart — acceptable for Prometheus) ──
//
// Kept OUT of app/api/metrics/route.ts on purpose: Next.js route files must
// only export route handlers/config, and dev-mode type generation fails a
// typecheck for any other export (e.g. `recordRequest`).

let requestCount = 0;
let errorCount = 0;
let rateLimitHits = 0;
const statusCodes: Record<number, number> = {};
const responseTimes: number[] = [];
const MAX_LATENCY_SAMPLES = 1000;

export function recordRequest(statusCode: number, durationMs: number) {
  requestCount++;
  statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
  if (statusCode >= 500) errorCount++;
  if (statusCode === 429) rateLimitHits++;
  if (responseTimes.length < MAX_LATENCY_SAMPLES) {
    responseTimes.push(durationMs);
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export interface RequestMetricsSnapshot {
  requestCount: number;
  errorCount: number;
  rateLimitHits: number;
  statusCodes: Record<number, number>;
  responseTimes: number[];
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
  };
}

/** Immutable snapshot of the in-process counters, for the /api/metrics endpoint. */
export function getRequestMetrics(): RequestMetricsSnapshot {
  return {
    requestCount,
    errorCount,
    rateLimitHits,
    statusCodes: { ...statusCodes },
    responseTimes: [...responseTimes],
    percentiles: {
      p50: percentile(responseTimes, 50),
      p90: percentile(responseTimes, 90),
      p95: percentile(responseTimes, 95),
      p99: percentile(responseTimes, 99),
      avg: avg(responseTimes),
    },
  };
}

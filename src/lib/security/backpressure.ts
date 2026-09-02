/**
 * Backpressure — prevents Node.js event loop saturation under 2K+ concurrent load.
 *
 * Problem at 2K concurrent:
 *   Without backpressure, every incoming request is accepted into the event loop.
 *   If DB/Redis is slow, the event loop queue grows, response times spike to 10-30s,
 *   and eventually Node.js runs out of memory or crashes.
 *
 * Solution:
 *   Track in-flight requests per scope. When a scope exceeds its max concurrent
 *   limit, reject new requests immediately with 429 — this is a feature, not a bug.
 *   It tells Nginx to retry on the next PM2 worker, distributing load evenly.
 *
 * Math for 2K concurrent on 4-core VPS:
 *   - PM2 cluster: 4 workers × 500 max concurrent = 2000 total
 *   - Each worker: ~125 max concurrent (well within Node.js capacity)
 *   - DB: 20 conns/worker × 4 = 80 total connections
 */

// ─── Per-scope counters ──────────────────────────────────────────────────

interface ScopeCounter {
  inFlight: number;
  maxConcurrent: number;
  rejected: number; // total rejected since start
}

const counters = new Map<string, ScopeCounter>();

// ─── Default limits ───────────────────────────────────────────────────────

export const BACKPRESSURE_LIMITS: Record<string, number> = {
  /** API routes: max 300 concurrent per worker (total: 1200 across 4 cores) */
  api: 300,
  /** Page routes: max 150 concurrent per worker (SSR is expensive) */
  page: 150,
  /** Auth: max 50 concurrent per worker (password hashing is CPU-heavy) */
  auth: 50,
  /** Checkout: max 80 concurrent per worker (stock checks, payment) */
  checkout: 80,
  /** Admin: max 100 concurrent per worker */
  admin: 100,
  /** Search: max 100 concurrent per worker */
  search: 100,
};

function getScopeCounter(scope: string): ScopeCounter {
  let counter = counters.get(scope);
  if (!counter) {
    counter = {
      inFlight: 0,
      maxConcurrent: BACKPRESSURE_LIMITS[scope] ?? 300,
      rejected: 0,
    };
    counters.set(scope, counter);
  }
  return counter;
}

/**
 * Check if a request is allowed for the given scope.
 * Returns null if allowed, or a response to return (429).
 */
export function checkBackpressure(
  scope: string,
  _path: string
): { allowed: true } | { allowed: false; response: Response } {
  const counter = getScopeCounter(scope);

  if (counter.inFlight >= counter.maxConcurrent) {
    counter.rejected++;
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Server is busy. Please try again in a moment.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "2",
            "X-Backpressure-Scope": scope,
            "X-Backpressure-Limit": String(counter.maxConcurrent),
          },
        }
      ),
    };
  }

  counter.inFlight++;
  return { allowed: true };
}

/** Release a slot after request completes. */
export function releaseBackpressure(scope: string): void {
  const counter = counters.get(scope);
  if (counter && counter.inFlight > 0) {
    counter.inFlight--;
  }
}

/**
 * Determine the backpressure scope from a request path.
 */
export function getBackpressureScope(pathname: string): string {
  if (pathname.startsWith("/api/auth/")) return "auth";
  if (pathname.startsWith("/api/admin/")) return "admin";
  if (pathname.startsWith("/api/search")) return "search";
  if (
    pathname.includes("/checkout") ||
    pathname.includes("/payment") ||
    pathname.includes("/cart/")
  ) {
    return "checkout";
  }
  if (pathname.startsWith("/api/")) return "api";
  return "page";
}

/** Get all scope metrics for the monitoring endpoint */
export function getBackpressureStats(): Array<{
  scope: string;
  inFlight: number;
  maxConcurrent: number;
  utilization: number;
  rejected: number;
}> {
  const result: Array<{
    scope: string;
    inFlight: number;
    maxConcurrent: number;
    utilization: number;
    rejected: number;
  }> = [];

  for (const [scope, counter] of counters) {
    result.push({
      scope,
      inFlight: counter.inFlight,
      maxConcurrent: counter.maxConcurrent,
      utilization: Math.round((counter.inFlight / counter.maxConcurrent) * 100),
      rejected: counter.rejected,
    });
  }

  return result;
}

/** Check if any scope is under pressure (>80% utilization) */
export function isSystemUnderPressure(): boolean {
  for (const [, counter] of counters) {
    if (counter.inFlight / counter.maxConcurrent > 0.8) {
      return true;
    }
  }
  return false;
}

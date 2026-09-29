/**
 * Backpressure — prevents Node.js event loop saturation under 2K+ concurrent load.
 *
 * Limits are configurable via BACKPRESSURE_<SCOPE>_MAX env vars.
 */

interface ScopeCounter {
  inFlight: number;
  maxConcurrent: number;
  rejected: number;
}

const counters = new Map<string, ScopeCounter>();

export const DEFAULT_BACKPRESSURE_LIMITS: Record<string, number> = {
  api: 300,
  page: 150,
  auth: 50,
  checkout: 80,
  admin: 150,
  search: 100,
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function scopeEnvKey(scope: string): string {
  return scope.replace(/[^a-z0-9]+/gi, "_").toUpperCase();
}

export function buildBackpressureLimits(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, number> {
  const built: Record<string, number> = {};
  for (const [scope, fallback] of Object.entries(DEFAULT_BACKPRESSURE_LIMITS)) {
    built[scope] = parsePositiveInt(env[`BACKPRESSURE_${scopeEnvKey(scope)}_MAX`], fallback);
  }
  return built;
}

function getScopeCounter(scope: string): ScopeCounter {
  let counter = counters.get(scope);
  if (!counter) {
    const limits = buildBackpressureLimits();
    counter = {
      inFlight: 0,
      maxConcurrent: limits[scope] ?? limits.api ?? DEFAULT_BACKPRESSURE_LIMITS.api,
      rejected: 0,
    };
    counters.set(scope, counter);
  }
  return counter;
}

export function checkBackpressure(
  scope: string,
  _path: string,
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
        },
      ),
    };
  }

  counter.inFlight++;
  return { allowed: true };
}

export function releaseBackpressure(scope: string): void {
  const counter = counters.get(scope);
  if (counter && counter.inFlight > 0) {
    counter.inFlight--;
  }
}

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

export function isSystemUnderPressure(): boolean {
  for (const [, counter] of counters) {
    if (counter.inFlight / counter.maxConcurrent > 0.8) {
      return true;
    }
  }
  return false;
}

/** @deprecated Use DEFAULT_BACKPRESSURE_LIMITS */
export const BACKPRESSURE_LIMITS = DEFAULT_BACKPRESSURE_LIMITS;

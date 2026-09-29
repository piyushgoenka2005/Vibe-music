export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export type RateLimitScopeKey =
  | "publicApi"
  | "mediaThumb"
  | "search"
  | "analytics"
  | "auth"
  | "checkout"
  | "admin"
  | "adminBulkImport"
  | "adminUpload"
  | "sensitiveAccess"
  | "health";

/** Baseline fixed-window limits (per IP) before env overrides and multiplier. */
export const DEFAULT_RATE_LIMITS: Record<RateLimitScopeKey, RateLimitOptions> = {
  publicApi: { limit: 180, windowMs: 60_000 },
  /** Homepage/product thumbs should not exhaust the general API bucket. */
  mediaThumb: { limit: 900, windowMs: 60_000 },
  search: { limit: 90, windowMs: 60_000 },
  analytics: { limit: 60, windowMs: 60_000 },
  auth: { limit: 40, windowMs: 60_000 },
  checkout: { limit: 20, windowMs: 60_000 },
  /** Admin catalog work (lists, saves, navigation). */
  admin: { limit: 600, windowMs: 60_000 },
  /** Bulk import preview + confirm cycles (heavy, low frequency). */
  adminBulkImport: { limit: 40, windowMs: 300_000 },
  /** Per-image CDN uploads during product editing. */
  adminUpload: { limit: 240, windowMs: 60_000 },
  sensitiveAccess: { limit: 60, windowMs: 60_000 },
  health: { limit: 600, windowMs: 60_000 },
};

const SCOPE_ENV_KEYS: Record<RateLimitScopeKey, string> = {
  publicApi: "PUBLIC_API",
  mediaThumb: "MEDIA_THUMB",
  search: "SEARCH",
  analytics: "ANALYTICS",
  auth: "AUTH",
  checkout: "CHECKOUT",
  admin: "ADMIN",
  adminBulkImport: "ADMIN_BULK_IMPORT",
  adminUpload: "ADMIN_UPLOAD",
  sensitiveAccess: "SENSITIVE_ACCESS",
  health: "HEALTH",
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMultiplier(raw: string | undefined): number {
  if (!raw?.trim()) return 1;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(parsed, 10);
}

function applyScopeEnvOverrides(
  scope: RateLimitScopeKey,
  defaults: RateLimitOptions,
  env: Record<string, string | undefined>,
): RateLimitOptions {
  const envKey = SCOPE_ENV_KEYS[scope];
  const limit = parsePositiveInt(env[`RATE_LIMIT_${envKey}_LIMIT`], defaults.limit);
  const windowMs = parsePositiveInt(env[`RATE_LIMIT_${envKey}_WINDOW_MS`], defaults.windowMs);
  return { limit, windowMs };
}

/**
 * Build effective rate limits from defaults, optional per-scope env overrides,
 * and an optional global multiplier (`RATE_LIMIT_MULTIPLIER`).
 */
export function buildRateLimits(
  env: Record<string, string | undefined> = process.env,
): Record<RateLimitScopeKey, RateLimitOptions> {
  const multiplier = parseMultiplier(env.RATE_LIMIT_MULTIPLIER);
  const built = {} as Record<RateLimitScopeKey, RateLimitOptions>;

  for (const scope of Object.keys(DEFAULT_RATE_LIMITS) as RateLimitScopeKey[]) {
    const overridden = applyScopeEnvOverrides(scope, DEFAULT_RATE_LIMITS[scope], env);
    built[scope] = {
      limit: Math.max(1, Math.round(overridden.limit * multiplier)),
      windowMs: overridden.windowMs,
    };
  }

  return built;
}

export function describeRateLimitConfig(
  limits: Record<RateLimitScopeKey, RateLimitOptions> = buildRateLimits(),
): Array<{ scope: RateLimitScopeKey; limit: number; windowMs: number; windowSec: number }> {
  return (Object.keys(limits) as RateLimitScopeKey[]).map((scope) => ({
    scope,
    limit: limits[scope].limit,
    windowMs: limits[scope].windowMs,
    windowSec: Math.ceil(limits[scope].windowMs / 1000),
  }));
}

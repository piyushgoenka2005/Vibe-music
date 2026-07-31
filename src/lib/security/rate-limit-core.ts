export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Client IP behind a trusted reverse proxy (nginx).
 * Prefer X-Real-IP (set by nginx to $remote_addr).
 * For X-Forwarded-For, use the rightmost hop(s) controlled by TRUST_PROXY_HOPS
 * (default 1) so clients cannot spoof the left-most entry.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return "unknown";
    const hops = Math.max(1, Number(process.env.TRUST_PROXY_HOPS ?? "1") || 1);
    const index = Math.max(0, parts.length - hops);
    return parts[index] ?? parts[parts.length - 1] ?? "unknown";
  }

  return "unknown";
}

export const RATE_LIMITS = {
  publicApi: { limit: 120, windowMs: 60_000 },
  /** Dedicated bucket so homepage thumbs do not exhaust publicApi (120/min). */
  mediaThumb: { limit: 600, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  analytics: { limit: 30, windowMs: 60_000 },
  auth: { limit: 20, windowMs: 60_000 },
  checkout: { limit: 10, windowMs: 60_000 },
  admin: { limit: 200, windowMs: 60_000 },
  sensitiveAccess: { limit: 30, windowMs: 60_000 },
  health: { limit: 300, windowMs: 60_000 },
} as const;

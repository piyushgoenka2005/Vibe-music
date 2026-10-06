import { getUpstashConfig } from "@/lib/security/upstashRedis";
import type { RateLimitOptions, RateLimitResult } from "@/lib/security/rate-limit-core";

/** When Upstash is configured in production, Redis errors must not widen limits via in-memory fallback. */
export function shouldFailClosedOnRateLimitBackendError(): boolean {
  return process.env.NODE_ENV === "production" && Boolean(getUpstashConfig());
}

export function rateLimitBackendFailureResult(options: RateLimitOptions): RateLimitResult {
  const bucket = Math.floor(Date.now() / options.windowMs);
  return {
    allowed: false,
    remaining: 0,
    resetAt: (bucket + 1) * options.windowMs,
  };
}

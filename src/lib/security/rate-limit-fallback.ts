import { getUpstashConfig } from "@/lib/security/upstashRedis";
import type { RateLimitOptions, RateLimitResult } from "@/lib/security/rate-limit-core";

/**
 * When Upstash is configured in production, external network latency or outages must not
 * block real customers with false 429s. By default, gracefully fall back to local in-memory
 * sliding-window rate limiting unless strict fail-closed mode is explicitly enabled.
 */
export function shouldFailClosedOnRateLimitBackendError(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(getUpstashConfig()) &&
    process.env.RATE_LIMIT_FAIL_CLOSED === "true"
  );
}

export function rateLimitBackendFailureResult(options: RateLimitOptions): RateLimitResult {
  const bucket = Math.floor(Date.now() / options.windowMs);
  return {
    allowed: false,
    remaining: 0,
    resetAt: (bucket + 1) * options.windowMs,
  };
}

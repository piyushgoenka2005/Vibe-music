import {
  checkRateLimit,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/security/rate-limit-core";
import {
  rateLimitBackendFailureResult,
  shouldFailClosedOnRateLimitBackendError,
} from "@/lib/security/rate-limit-fallback";
import { getUpstashConfig, upstashPipeline } from "@/lib/security/upstashRedis";

export async function edgeCheckRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const config = getUpstashConfig();
  if (!config) {
    return checkRateLimit(key, options);
  }

  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const bucket = Math.floor(Date.now() / options.windowMs);
  const redisKey = `rl:${key}:${bucket}`;

  try {
    const results = await upstashPipeline([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSec), "NX"],
    ]);

    const count = Number(results[0]?.result ?? 0);

    const resetAt = (bucket + 1) * options.windowMs;

    if (count > options.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - count),
      resetAt,
    };
  } catch {
    if (shouldFailClosedOnRateLimitBackendError()) {
      return rateLimitBackendFailureResult(options);
    }
    return checkRateLimit(key, options);
  }
}

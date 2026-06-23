import {
  checkRateLimit,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/security/rate-limit-core";
import { getUpstashConfig, upstashPipeline } from "@/lib/security/upstashRedis";

export async function edgeCheckRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const config = getUpstashConfig();
  if (!config) {
    return checkRateLimit(key, options);
  }

  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const bucket = Math.floor(Date.now() / options.windowMs);
  const redisKey = `rl:${key}:${bucket}`;

  try {
    const [incrResult, ttlResult] = await upstashPipeline([
      ["INCR", redisKey],
      ["TTL", redisKey],
    ]);

    const count = Number(incrResult?.result ?? 0);
    const ttl = Number(ttlResult?.result ?? -1);

    if (count === 1 || ttl < 0) {
      await upstashPipeline([["EXPIRE", redisKey, String(windowSec)]]);
    }

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
    return checkRateLimit(key, options);
  }
}

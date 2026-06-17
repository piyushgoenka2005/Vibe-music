import "server-only";

import {
  checkRateLimit,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/security/rate-limit";

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function upstashPipeline(
  commands: Array<[string, ...string[]]>
): Promise<Array<{ result: unknown }>> {
  const config = getUpstashConfig();
  if (!config) {
    throw new Error("Upstash not configured");
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.status}`);
  }

  const data = (await response.json()) as Array<{ result: unknown }>;
  return data;
}

/**
 * Distributed fixed-window rate limit via Upstash Redis REST.
 * Falls back to in-memory buckets when Upstash env vars are absent.
 */
export async function distributedCheckRateLimit(
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

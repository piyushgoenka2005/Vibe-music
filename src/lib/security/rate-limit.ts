import "server-only";

export {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/security/rate-limit-core";

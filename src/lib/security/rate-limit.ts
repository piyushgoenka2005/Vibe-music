import "server-only";

export {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/security/rate-limit-core";

export {
  buildRateLimits,
  DEFAULT_RATE_LIMITS,
  describeRateLimitConfig,
  type RateLimitScopeKey,
} from "@/lib/security/rate-limit-config";

export { resolveRateLimitScope } from "@/lib/security/rate-limit-scopes";

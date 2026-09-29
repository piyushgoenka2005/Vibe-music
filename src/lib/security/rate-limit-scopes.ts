import {
  buildRateLimits,
  type RateLimitOptions,
  type RateLimitScopeKey,
} from "@/lib/security/rate-limit-config";

export interface ResolvedRateLimitScope {
  scope: string;
  bucket: RateLimitScopeKey;
  options: RateLimitOptions;
}

/**
 * Map API paths to rate-limit buckets used by the edge proxy and route guards.
 */
export function resolveRateLimitScope(pathname: string): ResolvedRateLimitScope {
  const limits = buildRateLimits();

  if (pathname === "/api/health" || pathname === "/api/metrics") {
    return { scope: "health", bucket: "health", options: limits.health };
  }

  if (pathname.startsWith("/api/admin/products/import")) {
    return {
      scope: "admin-bulk-import",
      bucket: "adminBulkImport",
      options: limits.adminBulkImport,
    };
  }

  if (pathname.startsWith("/api/admin/upload/")) {
    return { scope: "admin-upload", bucket: "adminUpload", options: limits.adminUpload };
  }

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") {
      return { scope: "auth-api", bucket: "auth", options: limits.auth };
    }
    return { scope: "admin-api", bucket: "admin", options: limits.admin };
  }

  if (pathname.startsWith("/api/auth") || pathname === "/api/contact") {
    return { scope: "auth-api", bucket: "auth", options: limits.auth };
  }

  if (pathname.startsWith("/api/payment") || pathname.startsWith("/api/orders")) {
    return { scope: "checkout-api", bucket: "checkout", options: limits.checkout };
  }

  if (pathname.startsWith("/api/search")) {
    return { scope: "search-api", bucket: "search", options: limits.search };
  }

  if (pathname.startsWith("/api/media/thumb")) {
    return { scope: "media-thumb", bucket: "mediaThumb", options: limits.mediaThumb };
  }

  return { scope: "public-api", bucket: "publicApi", options: limits.publicApi };
}

import "server-only";

const BEARER_PREFIX = /^Bearer\s+/i;

/**
 * Protects /api/metrics from public scraping.
 * Set METRICS_SCRAPE_TOKEN on production VPS; Prometheus uses Authorization: Bearer <token>.
 */
export function isMetricsScrapeAuthorized(request: Request): boolean {
  const token = process.env.METRICS_SCRAPE_TOKEN?.trim();
  if (!token) {
    // Local dev / CI without token — allow scrape for ergonomics.
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header) return false;

  const presented = header.replace(BEARER_PREFIX, "").trim();
  return presented.length > 0 && presented === token;
}

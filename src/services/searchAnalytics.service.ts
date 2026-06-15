import type { SearchAnalyticsSource } from "@/types/searchAnalytics";

interface TrackSearchInput {
  query: string;
  resultCount: number;
  source: SearchAnalyticsSource;
}

interface TrackSearchClickInput {
  query: string;
  productId: string;
  productSlug: string;
  productName: string;
  source: SearchAnalyticsSource;
}

function postSearchAnalytics(body: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  void fetch("/api/analytics/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function trackSearchQuery({
  query,
  resultCount,
  source,
}: TrackSearchInput): void {
  postSearchAnalytics({
    eventType: "search",
    query,
    resultsCount: resultCount,
    source,
  });
}

export function trackSearchProductClick({
  query,
  productId,
  productSlug,
  productName,
  source,
}: TrackSearchClickInput): void {
  postSearchAnalytics({
    eventType: "click",
    query,
    clickedProductId: productId,
    clickedProductSlug: productSlug,
    clickedProductName: productName,
    source,
  });
}

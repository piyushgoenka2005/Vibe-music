export type SearchAnalyticsEventType = "search" | "click";

export type SearchAnalyticsSource =
  | "autocomplete"
  | "results-page"
  | "submit";

export interface SearchAnalyticsEvent {
  id: string;
  eventType: SearchAnalyticsEventType;
  query: string;
  queryNormalized: string;
  resultsCount: number | null;
  clickedProductId: string | null;
  clickedProductSlug: string | null;
  clickedProductName: string | null;
  source: SearchAnalyticsSource;
  timestamp: string;
}

export interface RecordSearchAnalyticsInput {
  eventType: SearchAnalyticsEventType;
  query: string;
  resultsCount?: number | null;
  clickedProductId?: string | null;
  clickedProductSlug?: string | null;
  clickedProductName?: string | null;
  source: SearchAnalyticsSource;
}

export interface SearchQueryStat {
  query: string;
  count: number;
  avgResults: number;
  lastSeen: string;
}

export interface TrendingSearchStat {
  query: string;
  recentCount: number;
  previousCount: number;
  changePercent: number;
}

export interface SearchAnalyticsDashboard {
  period: string;
  totals: {
    searches: number;
    clicks: number;
    zeroResults: number;
  };
  topSearches: SearchQueryStat[];
  zeroResultSearches: SearchQueryStat[];
  trendingSearches: TrendingSearchStat[];
  recentEvents: SearchAnalyticsEvent[];
}

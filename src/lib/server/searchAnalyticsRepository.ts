import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  RecordSearchAnalyticsInput,
  SearchAnalyticsDashboard,
  SearchAnalyticsEvent,
  SearchQueryStat,
  TrendingSearchStat,
} from "@/types/searchAnalytics";

const COLLECTION = "search_analytics_events";

function now(): string {
  return new Date().toISOString();
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function normalizeEvent(
  id: string,
  data: FirebaseFirestore.DocumentData
): SearchAnalyticsEvent {
  return {
    id,
    eventType: data.eventType === "click" ? "click" : "search",
    query: String(data.query ?? ""),
    queryNormalized: String(data.queryNormalized ?? ""),
    resultsCount:
      data.resultsCount === null || data.resultsCount === undefined
        ? null
        : Number(data.resultsCount),
    clickedProductId: data.clickedProductId
      ? String(data.clickedProductId)
      : null,
    clickedProductSlug: data.clickedProductSlug
      ? String(data.clickedProductSlug)
      : null,
    clickedProductName: data.clickedProductName
      ? String(data.clickedProductName)
      : null,
    source:
      data.source === "autocomplete" ||
      data.source === "submit" ||
      data.source === "results-page"
        ? data.source
        : "results-page",
    timestamp: String(data.timestamp ?? ""),
  };
}

function periodToMs(period: string): number {
  if (period === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (period === "90d") return 90 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

function parsePeriodStart(period: string): string {
  return new Date(Date.now() - periodToMs(period)).toISOString();
}

export async function recordSearchAnalyticsEvent(
  input: RecordSearchAnalyticsInput
): Promise<SearchAnalyticsEvent> {
  const query = input.query.trim();
  if (query.length < 2) {
    throw new Error("Query is too short");
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  const timestamp = now();

  const event: SearchAnalyticsEvent = {
    id: ref.id,
    eventType: input.eventType,
    query,
    queryNormalized: normalizeQuery(query),
    resultsCount:
      input.eventType === "click"
        ? null
        : Number(input.resultsCount ?? 0),
    clickedProductId: input.clickedProductId ?? null,
    clickedProductSlug: input.clickedProductSlug ?? null,
    clickedProductName: input.clickedProductName ?? null,
    source: input.source,
    timestamp,
  };

  await ref.set(event);
  return event;
}

async function fetchEventsSince(since: string): Promise<SearchAnalyticsEvent[]> {
  const snap = await getAdminFirestore()
    .collection(COLLECTION)
    .where("timestamp", ">=", since)
    .get();

  return snap.docs
    .map((doc) => normalizeEvent(doc.id, doc.data()))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function buildQueryStats(
  events: SearchAnalyticsEvent[],
  filter: (event: SearchAnalyticsEvent) => boolean
): SearchQueryStat[] {
  const map = new Map<
    string,
    { query: string; count: number; totalResults: number; lastSeen: string }
  >();

  for (const event of events) {
    if (!filter(event)) continue;
    const key = event.queryNormalized;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalResults += event.resultsCount ?? 0;
      if (event.timestamp > existing.lastSeen) {
        existing.lastSeen = event.timestamp;
        existing.query = event.query;
      }
    } else {
      map.set(key, {
        query: event.query,
        count: 1,
        totalResults: event.resultsCount ?? 0,
        lastSeen: event.timestamp,
      });
    }
  }

  return [...map.values()]
    .map((entry) => ({
      query: entry.query,
      count: entry.count,
      avgResults:
        entry.count > 0
          ? Math.round((entry.totalResults / entry.count) * 10) / 10
          : 0,
      lastSeen: entry.lastSeen,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildTrendingStats(
  events: SearchAnalyticsEvent[],
  periodMs: number
): TrendingSearchStat[] {
  const midpoint = new Date(Date.now() - periodMs / 2).toISOString();
  const recent = new Map<string, number>();
  const previous = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const event of events) {
    if (event.eventType !== "search") continue;
    const key = event.queryNormalized;
    labels.set(key, event.query);
    const bucket = event.timestamp >= midpoint ? recent : previous;
    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  }

  const keys = new Set([...recent.keys(), ...previous.keys()]);
  return [...keys]
    .map((key) => {
      const recentCount = recent.get(key) ?? 0;
      const previousCount = previous.get(key) ?? 0;
      const changePercent =
        previousCount === 0
          ? recentCount > 0
            ? 100
            : 0
          : Math.round(((recentCount - previousCount) / previousCount) * 100);
      return {
        query: labels.get(key) ?? key,
        recentCount,
        previousCount,
        changePercent,
      };
    })
    .filter((entry) => entry.recentCount > 0)
    .sort((a, b) => {
      if (b.changePercent !== a.changePercent) {
        return b.changePercent - a.changePercent;
      }
      return b.recentCount - a.recentCount;
    })
    .slice(0, 20);
}

export async function getSearchAnalyticsDashboard(
  period = "30d"
): Promise<SearchAnalyticsDashboard> {
  const since = parsePeriodStart(period);
  const events = await fetchEventsSince(since);
  const searchEvents = events.filter((event) => event.eventType === "search");
  const clickEvents = events.filter((event) => event.eventType === "click");
  const zeroResultEvents = searchEvents.filter(
    (event) => (event.resultsCount ?? 0) === 0
  );

  return {
    period,
    totals: {
      searches: searchEvents.length,
      clicks: clickEvents.length,
      zeroResults: zeroResultEvents.length,
    },
    topSearches: buildQueryStats(searchEvents, () => true).slice(0, 20),
    zeroResultSearches: buildQueryStats(
      searchEvents,
      (event) => (event.resultsCount ?? 0) === 0
    ).slice(0, 20),
    trendingSearches: buildTrendingStats(searchEvents, periodToMs(period)),
    recentEvents: events.slice(0, 50),
  };
}

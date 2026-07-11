import "server-only";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type {
  RecordSearchAnalyticsInput,
  SearchAnalyticsDashboard,
  SearchAnalyticsEvent,
  SearchQueryStat,
  TrendingSearchStat,
} from "@/types/searchAnalytics";

function now(): string {
  return new Date().toISOString();
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function encodeSource(eventType: string, source: string): string {
  return `${eventType}:${source}`;
}

function decodeSource(value: string): {
  eventType: SearchAnalyticsEvent["eventType"];
  source: SearchAnalyticsEvent["source"];
} {
  const [eventType, ...rest] = value.split(":");
  const source = rest.join(":") || "results-page";
  return {
    eventType: eventType === "click" ? "click" : "search",
    source:
      source === "autocomplete" || source === "submit" || source === "results-page"
        ? source
        : "results-page",
  };
}

function mapEvent(row: {
  id: string;
  query: string;
  resultCount: number;
  source: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: string;
}): SearchAnalyticsEvent {
  const { eventType, source } = decodeSource(row.source);
  const clickedMeta = row.sessionId?.split("|") ?? [];

  return {
    id: row.id,
    eventType,
    query: row.query,
    queryNormalized: normalizeQuery(row.query),
    resultsCount: eventType === "click" ? null : row.resultCount,
    clickedProductId: eventType === "click" ? row.userId : null,
    clickedProductSlug: eventType === "click" ? clickedMeta[0] ?? null : null,
    clickedProductName: eventType === "click" ? clickedMeta[1] ?? null : null,
    source,
    timestamp: row.createdAt,
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

  const timestamp = now();
  const id = randomUUID();
  const eventType = input.eventType;

  await prisma.searchAnalyticsEvent.create({
    data: {
      id,
      query,
      resultCount:
        eventType === "click" ? 0 : Number(input.resultsCount ?? 0),
      source: encodeSource(eventType, input.source),
      userId: eventType === "click" ? input.clickedProductId ?? null : null,
      sessionId:
        eventType === "click"
          ? [input.clickedProductSlug ?? "", input.clickedProductName ?? ""].join("|")
          : null,
      createdAt: timestamp,
    },
  });

  return mapEvent({
    id,
    query,
    resultCount: eventType === "click" ? 0 : Number(input.resultsCount ?? 0),
    source: encodeSource(eventType, input.source),
    userId: eventType === "click" ? input.clickedProductId ?? null : null,
    sessionId:
      eventType === "click"
        ? [input.clickedProductSlug ?? "", input.clickedProductName ?? ""].join("|")
        : null,
    createdAt: timestamp,
  });
}

async function fetchEventsSince(since: string): Promise<SearchAnalyticsEvent[]> {
  const rows = await prisma.searchAnalyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEvent);
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

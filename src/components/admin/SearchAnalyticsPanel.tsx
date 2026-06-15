"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingState } from "@/components/admin/AdminUi";
import type { SearchAnalyticsDashboard } from "@/types/searchAnalytics";

interface SearchAnalyticsPanelProps {
  period: string;
}

export default function SearchAnalyticsPanel({ period }: SearchAnalyticsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-search-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/search?period=${period}`);
      if (!res.ok) throw new Error("Failed to load search analytics");
      return res.json() as Promise<{ dashboard: SearchAnalyticsDashboard }>;
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading search analytics…" />;
  }

  const dashboard = data?.dashboard;
  if (!dashboard) {
    return <div className="admin-empty">Search analytics unavailable.</div>;
  }

  const topChartData = dashboard.topSearches.slice(0, 10).map((entry) => ({
    query:
      entry.query.length > 24 ? `${entry.query.slice(0, 24)}…` : entry.query,
    count: entry.count,
  }));

  return (
    <>
      <div className="admin-stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total Searches" value={dashboard.totals.searches} />
        <StatCard label="Product Clicks" value={dashboard.totals.clicks} />
        <StatCard label="Zero-Result Searches" value={dashboard.totals.zeroResults} />
      </div>

      <div className="admin-grid-2">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Top Searches</h2>
          </div>
          <div className="admin-panel__body">
            {topChartData.length === 0 ? (
              <div className="admin-empty">No search data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topChartData} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                  <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="query"
                    width={120}
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={{ background: "#141416", border: "1px solid #2a2a2e" }} />
                  <Bar dataKey="count" fill="#0072ba" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Trending Searches</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Recent</th>
                  <th>Previous</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.trendingSearches.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No trending searches yet.</td>
                  </tr>
                ) : (
                  dashboard.trendingSearches.slice(0, 10).map((entry) => (
                    <tr key={entry.query}>
                      <td>{entry.query}</td>
                      <td>{entry.recentCount}</td>
                      <td>{entry.previousCount}</td>
                      <td>{entry.changePercent >= 0 ? "+" : ""}{entry.changePercent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Zero-Result Searches</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Count</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.zeroResultSearches.length === 0 ? (
                  <tr>
                    <td colSpan={3}>No zero-result searches.</td>
                  </tr>
                ) : (
                  dashboard.zeroResultSearches.map((entry) => (
                    <tr key={entry.query}>
                      <td>{entry.query}</td>
                      <td>{entry.count}</td>
                      <td>{new Date(entry.lastSeen).toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Recent Search Activity</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Query</th>
                  <th>Results</th>
                  <th>Product</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No recent events.</td>
                  </tr>
                ) : (
                  dashboard.recentEvents.slice(0, 15).map((event) => (
                    <tr key={event.id}>
                      <td>{new Date(event.timestamp).toLocaleString("en-IN")}</td>
                      <td>{event.eventType}</td>
                      <td>{event.query}</td>
                      <td>
                        {event.eventType === "search"
                          ? event.resultsCount ?? 0
                          : "—"}
                      </td>
                      <td>{event.clickedProductName ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__label">{label}</div>
      <div className="admin-stat-card__value">{value.toLocaleString("en-IN")}</div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatCard } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import type { CompareAnalyticsSummary } from "@/types/compare";

function exportTopProductsCsv(products: CompareAnalyticsSummary["topProducts"]) {
  const header = "productId,name,compareAdds";
  const lines = products.map((p) => `${p.productId},"${p.name.replace(/"/g, '""')}",${p.count}`);
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "compare-top-products.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function CompareAnalyticsPanel() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-compare-analytics", period],
    queryFn: async () => {
      return adminFetchJson<{ analytics: CompareAnalyticsSummary }>(
        `/api/admin/compare/analytics?period=${period}`,
      );
    },
  });

  const chartData = useMemo(
    () =>
      (data?.analytics?.eventsByDay ?? []).map((row) => ({
        ...row,
        label: row.date.slice(5),
      })),
    [data?.analytics?.eventsByDay],
  );

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load compare analytics."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const a = data?.analytics;
  if (!a) return <EmptyState message="No compare analytics yet." />;

  return (
    <>
      <div className="admin-toolbar">
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        {a.topProducts.length > 0 ? (
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => exportTopProductsCsv(a.topProducts)}
          >
            Export top products CSV
          </button>
        ) : null}
      </div>

      <div className="admin-stat-grid">
        <StatCard label="Total events" value={a.totalEvents} />
        <StatCard label="Adds" value={a.adds} />
        <StatCard label="Removes" value={a.removes} />
        <StatCard label="Shares" value={a.shares} />
        <StatCard label="Share views" value={a.shareViews} />
        <StatCard label="Exports" value={a.exports} />
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Compare activity</h2>
        </div>
        <div className="admin-panel__body">
          {chartData.length === 0 ? (
            <EmptyState message="No compare events in this period." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Top compared products</h2>
        </div>
        <div className="admin-panel__body">
          {a.topProducts.length === 0 ? (
            <EmptyState message="No products added to compare yet." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Adds</th>
                  </tr>
                </thead>
                <tbody>
                  {a.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.name}</td>
                      <td>{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminComparePage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Product compare">
          <CompareAnalyticsPanel />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

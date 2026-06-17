"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, LoadingState, formatCurrency } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import SearchAnalyticsPanel from "@/components/admin/SearchAnalyticsPanel";

function AnalyticsContent() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: webhookData, isLoading: webhooksLoading } = useQuery({
    queryKey: ["admin-payment-webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments/webhooks?logs=true");
      if (!res.ok) throw new Error("Failed to load webhook metrics");
      return res.json();
    },
  });

  if (isLoading) return <LoadingState message="Loading analytics…" />;

  const report = data?.report;
  if (!report) return <div className="admin-empty">No analytics data.</div>;

  return (
    <>
      <div className="admin-toolbar">
        <select className="admin-select" style={{ width: "auto" }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className="admin-stat-grid">
        <StatCard label="Total Revenue" value={report.totalRevenue} format="currency" />
        <StatCard label="Total Orders" value={report.totalOrders} />
        <StatCard label="Avg Order Value" value={Math.round(report.averageOrderValue)} format="currency" />
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Search Analytics</h2>
        </div>
        <div className="admin-panel__body">
          <SearchAnalyticsPanel period={period} />
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel">
          <div className="admin-panel__header"><h2 className="admin-panel__title">Revenue Trend</h2></div>
          <div className="admin-panel__body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={report.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#141416", border: "1px solid #2a2a2e" }} formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header"><h2 className="admin-panel__title">Top Products</h2></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
              <tbody>
                {report.topProducts.map((p: { name: string; units: number; revenue: number }) => (
                  <tr key={p.name}><td>{p.name}</td><td>{p.units}</td><td>{formatCurrency(p.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header"><h2 className="admin-panel__title">Orders by Status</h2></div>
        <div className="admin-panel__body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {Object.entries(report.ordersByStatus as Record<string, number>).map(([status, count]) => (
            <div key={status} style={{ padding: "1rem", background: "var(--admin-surface-2)", borderRadius: "0.5rem", minWidth: "120px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)", textTransform: "capitalize" }}>{status}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Razorpay Webhooks</h2>
        </div>
        <div className="admin-panel__body">
          {webhooksLoading ? (
            <LoadingState message="Loading webhook metrics…" />
          ) : webhookData?.metrics ? (
            <>
              <div className="admin-stat-grid" style={{ marginBottom: "1rem" }}>
                <StatCard label="Total Events" value={webhookData.metrics.totalEvents} />
                <StatCard label="Processed" value={webhookData.metrics.processed} />
                <StatCard label="Failed" value={webhookData.metrics.failed} />
                <StatCard label="Last 24h" value={webhookData.metrics.last24Hours.total} />
              </div>

              {webhookData.metrics.recentFailures?.length > 0 ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Order</th>
                        <th>Error</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookData.metrics.recentFailures.map((row: {
                        id: string;
                        eventType: string;
                        orderId?: string | null;
                        error?: string | null;
                        createdAt: string;
                      }) => (
                        <tr key={row.id}>
                          <td>{row.eventType}</td>
                          <td>{row.orderId ?? "—"}</td>
                          <td>{row.error ?? "—"}</td>
                          <td>{new Date(row.createdAt).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">No recent webhook failures.</div>
              )}
            </>
          ) : (
            <div className="admin-empty">Webhook metrics unavailable.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Analytics">
          <AnalyticsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

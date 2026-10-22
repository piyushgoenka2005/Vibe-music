"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  TrendingUp,
  Download,
  DollarSign,
  PackageCheck,
  Receipt,
  Layers,
  Award,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import type { SalesReportSummary } from "@/app/api/admin/reports/route";

function ReportsContent() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-reports", range],
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async () => {
      return adminFetchJson<{ report: SalesReportSummary }>(`/api/admin/reports?range=${range}`);
    },
  });

  const handleExportCsv = () => {
    if (!data?.report) return;
    const r = data.report;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Period,${r.period}\n` +
      `Gross Revenue (INR),₹${r.totalGrossRevenue}\n` +
      `Net Revenue (INR),₹${r.totalNetRevenue}\n` +
      `Total Orders,${r.totalOrders}\n` +
      `Average Order Value,₹${r.averageOrderValue}\n` +
      `GST Collected (INR),₹${r.totalGstCollected}\n` +
      `Discounts Given,₹${r.discountsApplied}\n\n` +
      "Top Category,Revenue,Share %\n" +
      r.topCategories.map((c) => `${c.name},₹${c.revenue},${c.sharePercent}%`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vibemusic-sales-report-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to generate sales & revenue report."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const report = data?.report;
  if (!report) return null;

  return (
    <div className="admin-page">
      {/* Top Filter Bar */}
      <div className="admin-card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
              Sales, Revenue & Financial Reports
            </h2>
            <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
              Period: {report.period} • All amounts formatted in Indian Rupee (₹)
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                background: "var(--admin-surface-2)",
                borderRadius: "var(--admin-radius-sm)",
                padding: "0.2rem",
              }}
            >
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`admin-btn ${range === r ? "admin-btn--primary" : "admin-btn--secondary"}`}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem" }}
                >
                  {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={handleExportCsv}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="admin-grid admin-grid--4" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Gross Sales</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}
            >
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">
            ₹{report.totalGrossRevenue.toLocaleString("en-IN")}
          </div>
          <div className="admin-kpi__sub">Total merchandise value</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Total Orders</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-success-soft)", color: "var(--admin-success)" }}
            >
              <PackageCheck size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">{report.totalOrders}</div>
          <div className="admin-kpi__sub">Fulfilled order count</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">Average Order Value (AOV)</span>
            <span
              className="admin-kpi__icon"
              style={{ background: "var(--admin-warning-soft)", color: "var(--admin-warning)" }}
            >
              <DollarSign size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">
            ₹{report.averageOrderValue.toLocaleString("en-IN")}
          </div>
          <div className="admin-kpi__sub">Ticket size per transaction</div>
        </div>

        <div className="admin-card admin-kpi">
          <div className="admin-kpi__header">
            <span className="admin-kpi__label">GST Output Tax</span>
            <span
              className="admin-kpi__icon"
              style={{
                background: "var(--admin-kpi-products-soft)",
                color: "var(--admin-kpi-products)",
              }}
            >
              <Receipt size={18} />
            </span>
          </div>
          <div className="admin-kpi__value">
            ₹{report.totalGstCollected.toLocaleString("en-IN")}
          </div>
          <div className="admin-kpi__sub">Tax collected for deposit</div>
        </div>
      </div>

      {/* Detailed Tables Split */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Top Categories */}
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--admin-border)" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Layers size={18} color="var(--admin-accent)" />
              Category Revenue Share
            </h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {report.topCategories.map((c) => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>₹{c.revenue.toLocaleString("en-IN")}</td>
                  <td>{c.orderCount}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="admin-badge admin-badge--neutral">{c.sharePercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Brands */}
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--admin-border)" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Award size={18} color="var(--admin-warning)" />
              Top Brands by Revenue
            </h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand Name</th>
                <th>Revenue</th>
                <th>Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {report.topBrands.map((b) => (
                <tr key={b.name}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>₹{b.revenue.toLocaleString("en-IN")}</td>
                  <td>{b.unitsSold} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <AdminGuard>
      {(session) => (
        <AdminShell admin={session} title="Financial & Sales Reports">
          <ReportsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

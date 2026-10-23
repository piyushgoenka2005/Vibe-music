"use client";

import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Package,
  Layers,
  CalendarDays,
  BarChart3,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import { LoadingState, StatCard, EmptyState, formatCurrency } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import type { RentalAnalyticsSummary } from "@/types/rental";

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  active: TrendingUp,
  returned: RotateCcw,
  completed: ShieldCheck,
  late: AlertCircle,
  cancelled: AlertCircle,
};

function RentalsAdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-analytics"],
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async () => {
      return adminFetchJson<{ analytics: RentalAnalyticsSummary }>("/api/admin/rentals/analytics");
    },
  });

  const analytics = data?.analytics;

  if (isLoading) return <LoadingState message="Loading rentals dashboard…" />;
  if (error || !analytics) {
    return (
      <ErrorState
        message="Unable to load rentals overview."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const recoveriesTotal =
    (analytics.lateFeesCollected ?? 0) + (analytics.damageChargesCollected ?? 0);
  const statusEntries = Object.entries(analytics.bookingsByStatus ?? {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Action Toolbar */}
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href={ROUTES.adminRentalProducts} className="admin-btn admin-btn--primary">
          <Package size={16} /> Manage Fleet
        </Link>
        <Link href={ROUTES.adminRentalBookings} className="admin-btn admin-btn--secondary">
          <CalendarDays size={16} /> All Bookings
        </Link>
        <Link href={ROUTES.adminRentalCategories} className="admin-btn admin-btn--secondary">
          <Layers size={16} /> Rental Categories
        </Link>
        <Link href={ROUTES.adminRentalAnalytics} className="admin-btn admin-btn--secondary">
          <BarChart3 size={16} /> Deep Analytics
        </Link>
        <Link href={ROUTES.adminRentalPolicies} className="admin-btn admin-btn--secondary">
          <FileText size={16} /> Policies & Terms
        </Link>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => void refetch()}
          disabled={isFetching}
          style={{ marginLeft: "auto" }}
          title="Refresh rentals metrics"
        >
          <RotateCcw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stat-grid">
        <StatCard label="Total Bookings" value={analytics.totalBookings ?? 0} />
        <StatCard label="Active Fleet Rentals" value={analytics.activeBookings ?? 0} />
        <StatCard label="Rental Revenue" value={analytics.totalRevenue ?? 0} format="currency" />
        <StatCard
          label="Security Deposits Held"
          value={analytics.totalDeposits ?? 0}
          format="currency"
        />
        <StatCard label="Recoveries (Late & Damages)" value={recoveriesTotal} format="currency" />
      </div>

      {/* Booking Status Distribution */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Bookings by Status</h2>
        </div>
        <div className="admin-panel__body">
          {statusEntries.length === 0 ? (
            <p style={{ color: "var(--admin-muted)", margin: 0 }}>No bookings recorded yet.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {statusEntries.map(([status, count]) => {
                const IconComponent = STATUS_ICONS[status] || Clock;
                return (
                  <Link
                    key={status}
                    href={`${ROUTES.adminRentalBookings}?status=${encodeURIComponent(status)}`}
                    className="admin-card"
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "var(--admin-muted)",
                        fontSize: "0.75rem",
                        textTransform: "capitalize",
                      }}
                    >
                      <IconComponent size={14} />
                      <span>{status}</span>
                    </div>
                    <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{count}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Rented Products */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Top Rented Gear & Instruments</h2>
        </div>
        <div className="admin-panel__body">
          {!analytics.topProducts || analytics.topProducts.length === 0 ? (
            <EmptyState message="No rental products rented yet." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Instrument / Gear</th>
                    <th style={{ textAlign: "right" }}>Bookings</th>
                    <th style={{ textAlign: "right" }}>Revenue Generated</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ textAlign: "right" }}>{p.bookings}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(p.revenue)}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          href={`${ROUTES.adminRentalProducts}?productId=${encodeURIComponent(p.productId)}`}
                          className="admin-btn admin-btn--ghost"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          View Unit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRentalsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rentals & Instrument Hire">
          <RentalsAdminDashboard />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

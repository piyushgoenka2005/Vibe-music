"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatCard, formatCurrency } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";

type RentalAnalytics = {
  period: string;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  totalDeposits: number;
  lateFeesCollected: number;
  damageChargesCollected: number;
  bookingsByStatus: Record<string, number>;
  bookingsByMonth: Array<{ month: string; count: number; revenue: number }>;
  topProducts: Array<{ productId: string; name: string; bookings: number; revenue: number }>;
};

function RentalsAnalyticsPanel() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-analytics", period],
    queryFn: async () => {
      return adminFetchJson<{ analytics: RentalAnalytics }>(
        `/api/admin/rentals/analytics?period=${period}`,
      );
    },
  });

  const statusChart = useMemo(() => {
    const statuses = data?.analytics?.bookingsByStatus ?? {};
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
  }, [data?.analytics?.bookingsByStatus]);

  const monthChart = useMemo(
    () =>
      (data?.analytics?.bookingsByMonth ?? []).map((row) => ({
        ...row,
        label: row.month,
      })),
    [data?.analytics?.bookingsByMonth],
  );

  if (isLoading) return <LoadingState message="Loading rental analytics…" />;
  if (error || !data?.analytics) {
    return (
      <ErrorState
        message="Unable to load rental analytics."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const analytics = data.analytics;

  return (
    <>
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
        <Link href={ROUTES.adminRentals} className="admin-btn admin-btn--secondary">
          Overview
        </Link>
        <Link href={ROUTES.adminRentalProducts} className="admin-btn admin-btn--secondary">
          Products
        </Link>
        <Link href={ROUTES.adminRentalBookings} className="admin-btn admin-btn--secondary">
          Bookings
        </Link>
      </div>

      <div className="admin-stat-grid" style={{ marginTop: "1rem" }}>
        <StatCard label="Total bookings" value={analytics.totalBookings ?? 0} />
        <StatCard label="Active rentals" value={analytics.activeBookings ?? 0} />
        <StatCard label="Revenue" value={analytics.totalRevenue ?? 0} format="currency" />
        <StatCard label="Deposits held" value={analytics.totalDeposits ?? 0} format="currency" />
        <StatCard label="Late fees" value={analytics.lateFeesCollected ?? 0} format="currency" />
        <StatCard
          label="Damage charges"
          value={analytics.damageChargesCollected ?? 0}
          format="currency"
        />
      </div>

      <div className="admin-grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Bookings by month</h2>
          </div>
          <div className="admin-panel__body">
            {monthChart.length === 0 ? (
              <EmptyState message="No bookings in this period." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Bookings by status</h2>
          </div>
          <div className="admin-panel__body">
            {statusChart.length === 0 ? (
              <EmptyState message="No status breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Top rental products</h2>
        </div>
        <div className="admin-panel__body">
          {analytics.topProducts.length === 0 ? (
            <EmptyState message="No rental line items in this period." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((row) => (
                    <tr key={row.productId}>
                      <td>{row.name}</td>
                      <td>{row.bookings}</td>
                      <td>{formatCurrency(row.revenue)}</td>
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

export default function AdminRentalsAnalyticsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rental analytics">
          <RentalsAnalyticsPanel />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

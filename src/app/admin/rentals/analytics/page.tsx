"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { LoadingState, StatCard } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";

type RentalAnalytics = {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  totalDeposits: number;
  lateFeesCollected: number;
  damageChargesCollected: number;
};

function RentalsAnalyticsPanel() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ analytics: RentalAnalytics }>;
    },
  });

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
        <StatCard
          label="Revenue"
          value={analytics.totalRevenue ?? 0}
          format="currency"
        />
        <StatCard
          label="Deposits held"
          value={analytics.totalDeposits ?? 0}
          format="currency"
        />
        <StatCard
          label="Late fees"
          value={analytics.lateFeesCollected ?? 0}
          format="currency"
        />
        <StatCard
          label="Damage charges"
          value={analytics.damageChargesCollected ?? 0}
          format="currency"
        />
      </div>

      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Summary</h2>
        </div>
        <div className="admin-panel__body">
          <p>
            Collected late fees and damage charges total{" "}
            <strong>
              {formatCurrency(
                (analytics.lateFeesCollected ?? 0) + (analytics.damageChargesCollected ?? 0)
              )}
            </strong>
            .
          </p>
          <p style={{ marginTop: "0.5rem", color: "var(--admin-muted)" }}>
            Use Bookings to update rental status, deposits, and returns.
          </p>
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

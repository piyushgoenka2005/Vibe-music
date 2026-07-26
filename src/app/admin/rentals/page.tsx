"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { LoadingState, StatCard } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";

function RentalsAdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-rental-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const analytics = data?.analytics;

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Unable to load rentals overview."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href={ROUTES.adminRentalProducts} className="admin-btn admin-btn--secondary">
          Products
        </Link>
        <Link href={ROUTES.adminRentalCategories} className="admin-btn admin-btn--secondary">
          Categories
        </Link>
        <Link href={ROUTES.adminRentalBookings} className="admin-btn admin-btn--secondary">
          Bookings
        </Link>
        <Link href={ROUTES.adminRentalAnalytics} className="admin-btn admin-btn--secondary">
          Analytics
        </Link>
        <Link href={ROUTES.adminRentalPolicies} className="admin-btn admin-btn--secondary">
          Policies
        </Link>
      </div>
      <div className="admin-stat-grid" style={{ marginTop: "1rem" }}>
        <StatCard label="Total bookings" value={analytics?.totalBookings ?? 0} />
        <StatCard label="Active rentals" value={analytics?.activeBookings ?? 0} />
        <StatCard label="Revenue" value={analytics?.totalRevenue ?? 0} format="currency" />
        <StatCard label="Deposits held" value={analytics?.totalDeposits ?? 0} format="currency" />
      </div>
    </>
  );
}

export default function AdminRentalsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Rentals">
          <RentalsAdminDashboard />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

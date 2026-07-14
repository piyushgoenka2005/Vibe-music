"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";

function RentalsAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rental-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rentals/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const analytics = data?.analytics;

  if (isLoading) return <LoadingState />;

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
      <div className="admin-panel" style={{ marginTop: "1rem" }}>
        <div className="admin-panel__body">
          <p>Total bookings: {analytics?.totalBookings ?? 0}</p>
          <p>Active rentals: {analytics?.activeBookings ?? 0}</p>
          <p>Revenue: {formatCurrency(analytics?.totalRevenue ?? 0)}</p>
          <p>Deposits held: {formatCurrency(analytics?.totalDeposits ?? 0)}</p>
          <p>Late fees: {formatCurrency(analytics?.lateFeesCollected ?? 0)}</p>
          <p>Damage charges: {formatCurrency(analytics?.damageChargesCollected ?? 0)}</p>
        </div>
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

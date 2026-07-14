"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";

function FinanceAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/finance/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <LoadingState />;
  const a = data?.analytics;

  return (
    <>
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href={ROUTES.adminFinanceProviders} className="admin-btn admin-btn--secondary">Providers</Link>
        <Link href={ROUTES.adminFinancePlans} className="admin-btn admin-btn--secondary">Plans</Link>
        <Link href={ROUTES.adminFinanceApplications} className="admin-btn admin-btn--secondary">Applications</Link>
      </div>
      <div className="admin-panel" style={{ marginTop: "1rem" }}>
        <div className="admin-panel__body">
          <p>Total applications: {a?.totalApplications ?? 0}</p>
          <p>Pending review: {a?.pendingReview ?? 0}</p>
          <p>Approved: {a?.approved ?? 0}</p>
          <p>Rejected: {a?.rejected ?? 0}</p>
          <p>Order value pipeline: {formatCurrency(a?.totalOrderValue ?? 0)}</p>
        </div>
      </div>
    </>
  );
}

export default function AdminFinancingPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Financing">
          <FinanceAdminDashboard />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

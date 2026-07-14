"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ROUTES } from "@/lib/routes";

function GiveawayAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-giveaway-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/giveaway/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) return <LoadingState />;
  const a = data?.analytics;

  return (
    <>
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href={ROUTES.adminGiveawayCampaigns} className="admin-btn admin-btn--secondary">
          Campaigns
        </Link>
      </div>
      <div className="admin-panel" style={{ marginTop: "1rem" }}>
        <div className="admin-panel__body">
          <p>Total campaigns: {a?.totalCampaigns ?? 0}</p>
          <p>Active campaigns: {a?.activeCampaigns ?? 0}</p>
          <p>Total entries: {a?.totalEntries ?? 0}</p>
          <p>Verified entries: {a?.verifiedEntries ?? 0}</p>
          <p>Winners selected: {a?.totalWinners ?? 0}</p>
        </div>
      </div>
    </>
  );
}

export default function AdminGiveawayPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Giveaways">
          <GiveawayAdminDashboard />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

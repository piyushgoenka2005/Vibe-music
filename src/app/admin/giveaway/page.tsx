"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { EmptyState, LoadingState, StatCard } from "@/components/admin/AdminUi";
import { adminGiveawayCampaignPath, ROUTES } from "@/lib/routes";

function GiveawayAdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-giveaway-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/giveaway/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        analytics: {
          totalCampaigns: number;
          activeCampaigns: number;
          totalEntries: number;
          verifiedEntries: number;
          totalWinners: number;
          entriesByCampaign?: Array<{
            campaignId: string;
            title: string;
            count: number;
          }>;
        };
      }>;
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data?.analytics) {
    return (
      <ErrorState
        message="Unable to load giveaway analytics."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const a = data.analytics;

  return (
    <>
      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href={ROUTES.adminGiveawayCampaigns} className="admin-btn admin-btn--primary">
          Manage campaigns
        </Link>
      </div>
      <div className="admin-stat-grid" style={{ marginTop: "1rem" }}>
        <StatCard label="Total campaigns" value={a.totalCampaigns ?? 0} />
        <StatCard label="Active campaigns" value={a.activeCampaigns ?? 0} />
        <StatCard label="Total entries" value={a.totalEntries ?? 0} />
        <StatCard label="Verified entries" value={a.verifiedEntries ?? 0} />
        <StatCard label="Winners selected" value={a.totalWinners ?? 0} />
      </div>
      <div className="admin-panel" style={{ marginTop: "1.5rem" }}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Top campaigns by entries</h2>
        </div>
        <div className="admin-panel__body">
          {(a.entriesByCampaign ?? []).length === 0 ? (
            <EmptyState message="No entries yet." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {(a.entriesByCampaign ?? []).map((row) => (
                    <tr key={row.campaignId}>
                      <td>
                        <Link href={adminGiveawayCampaignPath(row.campaignId)}>
                          {row.title}
                        </Link>
                      </td>
                      <td>{row.count}</td>
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

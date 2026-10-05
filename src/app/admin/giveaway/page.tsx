"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import {
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
  formatDate,
} from "@/components/admin/AdminUi";
import { adminGiveawayCampaignPath, ROUTES } from "@/lib/routes";

type GiveawayAnalytics = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEntries: number;
  verifiedEntries: number;
  totalWinners: number;
  entriesByCampaign?: Array<{ campaignId: string; title: string; count: number }>;
  recentCampaigns?: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    startsAt: string;
    endsAt: string;
    drawAt: string | null;
    winnersAnnounced: boolean;
    entryCount: number;
    winnerCount: number;
  }>;
};

function GiveawayAdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-giveaway-analytics"],
    queryFn: async () => {
      return adminFetchJson<{ analytics: GiveawayAnalytics }>("/api/admin/giveaway/analytics");
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
        <Link
          href={`${ROUTES.adminGiveawayCampaigns}?new=1`}
          className="admin-btn admin-btn--secondary"
        >
          Create campaign
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
          <h2 className="admin-panel__title">Recent campaigns</h2>
        </div>
        <div className="admin-panel__body">
          {(a.recentCampaigns ?? []).length === 0 ? (
            <EmptyState message="No campaigns yet." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Entries</th>
                    <th>Winners</th>
                    <th>Ends</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(a.recentCampaigns ?? []).map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={adminGiveawayCampaignPath(row.id)}>{row.title}</Link>
                      </td>
                      <td>
                        <StatusBadge status={row.status} />
                        {row.winnersAnnounced ? (
                          <span
                            className="admin-badge admin-badge--neutral"
                            style={{ marginLeft: 6 }}
                          >
                            Announced
                          </span>
                        ) : null}
                      </td>
                      <td>{row.entryCount}</td>
                      <td>{row.winnerCount}</td>
                      <td>{formatDate(row.endsAt)}</td>
                      <td>
                        <Link
                          href={adminGiveawayCampaignPath(row.id)}
                          className="admin-btn admin-btn--ghost"
                          style={{ padding: "0.25rem 0.5rem" }}
                        >
                          Open
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
                        <Link href={adminGiveawayCampaignPath(row.campaignId)}>{row.title}</Link>
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

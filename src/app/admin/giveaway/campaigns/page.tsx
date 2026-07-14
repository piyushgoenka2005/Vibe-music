"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatusBadge } from "@/components/admin/AdminUi";

function CampaignsAdmin() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-giveaway-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/giveaway/campaigns");
      return res.json();
    },
  });

  const drawMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${id}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Draw failed");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] }),
  });

  const announceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/giveaway/campaigns/${id}/announce`, { method: "POST" });
      if (!res.ok) throw new Error("Announce failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-giveaway-campaigns"] }),
  });

  if (isLoading) return <LoadingState />;
  const campaigns = data?.campaigns ?? [];

  return (
    <div className="admin-panel">
      {campaigns.length === 0 ? (
        <EmptyState message="No giveaway campaigns." />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Entries</th>
              <th>Ends</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c: {
              id: string;
              title: string;
              slug: string;
              status: string;
              entryCount?: number;
              endsAt: string;
              winnersAnnounced: boolean;
            }) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/giveaway/${c.slug}`}>{c.title}</Link>
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.entryCount ?? 0}</td>
                <td>{new Date(c.endsAt).toLocaleDateString("en-IN")}</td>
                <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <a
                    href={`/api/admin/giveaway/campaigns/${c.id}/export`}
                    className="admin-btn admin-btn--ghost"
                  >
                    Export
                  </a>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => drawMutation.mutate(c.id)}
                  >
                    Draw
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={c.winnersAnnounced}
                    onClick={() => announceMutation.mutate(c.id)}
                  >
                    Announce
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminGiveawayCampaignsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Giveaway campaigns">
          <CampaignsAdmin />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

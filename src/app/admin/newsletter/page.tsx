"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import { ErrorState, MutationError } from "@/components/admin/AdminQueryState";

type Subscriber = {
  email: string;
  firstName?: string;
  lastName?: string;
  marketing: boolean;
  subscribedAt: string;
  source: string;
};

function NewsletterContent({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } =
    useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-newsletter", cursor],
    queryFn: async () => {
      const url = `/api/admin/newsletter?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        subscribers: Subscriber[];
        total: number;
        hasMore: boolean;
        nextCursor?: string;
      }>;
    },
  });
  const hasMore = data?.hasMore ?? false;

  const deleteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(
        `/api/admin/newsletter?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ["admin-newsletter"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load newsletter subscribers."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const subscribers = data?.subscribers ?? [];

  return (
    <>
      <div className="admin-toolbar">
        <span>{data?.total ?? 0} subscribers</span>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => {
            window.location.href = "/api/admin/newsletter?export=csv";
          }}
        >
          Export CSV
        </button>
      </div>
      <div className="admin-panel">
        <MutationError error={deleteMutation.isError ? deleteMutation.error : null} />
        {subscribers.length === 0 ? (
          <EmptyState message="No newsletter subscribers yet." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Marketing</th>
                  <th>Subscribed</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.email}>
                    <td>{s.email}</td>
                    <td>
                      {[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td>
                      <StatusBadge status={s.marketing ? "active" : "cancelled"} />
                    </td>
                    <td>{formatDate(s.subscribedAt)}</td>
                    <td>{s.source}</td>
                    <td>
                      {canWrite ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => {
                            if (window.confirm(`Remove ${s.email} from newsletter?`)) {
                              deleteMutation.mutate(s.email);
                            }
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
          }}
        >
          <span style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>
            Page {pageIndex + 1}
            {typeof data?.total === "number" ? ` · ${data.total} total` : ""}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!canGoPrev || isFetching}
              onClick={goPrev}
            >
              Previous
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={!hasMore || isFetching}
              onClick={() => goNext(data?.nextCursor)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminNewsletterPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Newsletter">
          <NewsletterContent canWrite={admin.permissions.includes("customers:write")} />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

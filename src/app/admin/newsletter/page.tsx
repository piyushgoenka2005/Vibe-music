"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import {
  ErrorState,
  MutationError,
  adminFetchJson,
  adminMutateJson,
} from "@/components/admin/AdminQueryState";
import { downloadFromApi } from "@/lib/client/downloadFromApi";

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
  const { cursor, pageIndex, canGoPrev, goNext, goPrev } = useAdminCursorPagination();
  const [addForm, setAddForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    marketing: true,
  });
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["admin-newsletter", cursor],
    queryFn: async () => {
      const url = `/api/admin/newsletter?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      return adminFetchJson<{
        subscribers: Subscriber[];
        total: number;
        hasMore: boolean;
        nextCursor?: string;
      }>(url);
    },
    // Live table: new signups show up without a manual refresh.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });
  const hasMore = data?.hasMore ?? false;

  const addMutation = useMutation({
    mutationFn: async () => {
      return adminMutateJson<{ created: boolean }>("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
    },
    onSuccess: (result) => {
      setAddSuccess(
        result.created
          ? "Subscriber added."
          : "Subscriber already existed — marketing preference updated if needed.",
      );
      setAddForm({ email: "", firstName: "", lastName: "", marketing: true });
      void queryClient.invalidateQueries({ queryKey: ["admin-newsletter"] });
    },
  });

  const deleteMutation = useMutation({
    // Optimistic: the row disappears the instant you confirm.
    mutationFn: async (email: string) => {
      await adminMutateJson(`/api/admin/newsletter?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      return email;
    },
    onMutate: async (email) => {
      await queryClient.cancelQueries({ queryKey: ["admin-newsletter", cursor] });
      const previous = queryClient.getQueryData<{
        subscribers: Subscriber[];
        total: number;
        hasMore: boolean;
      }>(["admin-newsletter", cursor]);
      if (previous) {
        queryClient.setQueryData(["admin-newsletter", cursor], {
          ...previous,
          subscribers: previous.subscribers.filter((s) => s.email !== email),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_err, _email, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-newsletter", cursor], context.previous);
      }
    },
    onSettled: () => {
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
            downloadFromApi("/api/admin/newsletter?export=csv");
          }}
        >
          Export CSV
        </button>
      </div>
      {canWrite ? (
        <div className="admin-panel" style={{ marginBottom: "1rem" }}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Add subscriber</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>First name</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={addForm.firstName}
                  onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>Last name</label>
                <input
                  className="admin-input"
                  style={{ width: "100%" }}
                  value={addForm.lastName}
                  onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={addForm.marketing}
                    onChange={(e) => setAddForm({ ...addForm, marketing: e.target.checked })}
                  />
                  Marketing opt-in
                </label>
              </div>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={addMutation.isPending || !addForm.email.trim()}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? "Adding…" : "Add subscriber"}
            </button>
            {addSuccess ? (
              <p className="admin-form-success" style={{ marginTop: "0.75rem" }}>
                {addSuccess}
              </p>
            ) : null}
            <MutationError error={addMutation.isError ? addMutation.error : null} />
          </div>
        </div>
      ) : null}

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
                    <td>{[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}</td>
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
            {dataUpdatedAt ? ` · updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ""}
            {isFetching ? " · refreshing…" : ""}
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

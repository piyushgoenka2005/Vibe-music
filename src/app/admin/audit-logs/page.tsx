"use client";

import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";

function AuditLogsContent() {
  const { cursor, pageIndex, canGoPrev, goNext, goPrev } =
    useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit-logs", cursor],
    queryFn: async () => {
      const sp = new URLSearchParams({ limit: "50" });
      if (cursor) sp.set("cursor", cursor);
      const res = await fetch(`/api/admin/audit-logs?${sp}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json() as Promise<{
        logs: Array<{
          id: string;
          action: string;
          actorEmail: string | null;
          resourceType: string | null;
          resourceId: string | null;
          ip: string | null;
          createdAt: string;
        }>;
        hasMore: boolean;
        nextCursor?: string;
      }>;
    },
  });

  if (isLoading) return <LoadingState message="Loading audit logs…" />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load audit logs."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const logs = data?.logs ?? [];
  const hasMore = data?.hasMore ?? false;

  if (logs.length === 0) {
    return <div className="admin-empty">No audit events recorded yet.</div>;
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Action</th>
              <th scope="col">Actor</th>
              <th scope="col">Resource</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                <td>
                  <code>{log.action}</code>
                </td>
                <td>{log.actorEmail ?? "—"}</td>
                <td>
                  {log.resourceType
                    ? `${log.resourceType}${log.resourceId ? ` · ${log.resourceId}` : ""}`
                    : "—"}
                </td>
                <td>{log.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-pagination">
        <span>Page {pageIndex + 1}</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            disabled={!canGoPrev}
            onClick={goPrev}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            disabled={!hasMore}
            onClick={() => goNext(data?.nextCursor)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Audit logs">
          <p className="admin-page-lead">
            Security and admin activity trail for compliance review.
          </p>
          <AuditLogsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

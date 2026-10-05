"use client";

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState } from "@/components/admin/AdminUi";
import { ErrorState, adminFetchJson } from "@/components/admin/AdminQueryState";
import { useAdminCursorPagination } from "@/hooks/useAdminCursorPagination";
type AuditLogRow = {
  id: string;
  action: string;
  actorEmail: string | null;
  resourceType: string | null;
  resourceId: string | null;
  ip: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadAuditLogsCsv(logs: AuditLogRow[]) {
  const header = ["Time", "Action", "Actor", "Resource Type", "Resource ID", "IP", "Metadata"];
  const rows = logs.map((log) =>
    [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.actorEmail ?? "",
      log.resourceType ?? "",
      log.resourceId ?? "",
      log.ip ?? "",
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]
      .map(escapeCsv)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function AuditLogsContent() {
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { cursor, pageIndex, canGoPrev, reset, goNext, goPrev } = useAdminCursorPagination();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit-logs", cursor, actionFilter, actorFilter],
    queryFn: async () => {
      const sp = new URLSearchParams({ limit: "50" });
      if (cursor) sp.set("cursor", cursor);
      if (actionFilter.trim()) sp.set("action", actionFilter.trim());
      if (actorFilter.trim()) sp.set("actorEmail", actorFilter.trim());
      return adminFetchJson<{
        logs: AuditLogRow[];
        hasMore: boolean;
        nextCursor?: string;
      }>(`/api/admin/audit-logs?${sp}`);
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

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="admin-input"
          style={{ width: "auto", minWidth: 160 }}
          placeholder="Filter by action"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            reset();
          }}
        />
        <input
          className="admin-input"
          style={{ width: "auto", minWidth: 180 }}
          placeholder="Filter by actor email"
          value={actorFilter}
          onChange={(e) => {
            setActorFilter(e.target.value);
            reset();
          }}
        />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={logs.length === 0}
          onClick={() => downloadAuditLogsCsv(logs)}
        >
          Export CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="admin-empty">No audit events recorded yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Action</th>
                <th scope="col">Actor</th>
                <th scope="col">Resource</th>
                <th scope="col">IP</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr>
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
                    <td>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          style={{ padding: "0.25rem 0.5rem" }}
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          {expandedId === log.id ? "Hide" : "Details"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {expandedId === log.id && log.metadata ? (
                    <tr>
                      <td colSpan={6}>
                        <pre
                          style={{
                            margin: 0,
                            padding: "0.75rem",
                            background: "var(--admin-surface-2)",
                            borderRadius: 6,
                            fontSize: "0.8rem",
                            overflow: "auto",
                          }}
                        >
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

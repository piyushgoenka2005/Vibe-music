"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, formatDate } from "@/components/admin/AdminUi";
import {
  ErrorState,
  MutationError,
  adminFetchJson,
  adminMutateJson,
} from "@/components/admin/AdminQueryState";
import { normalizeAdminNotificationLink } from "@/lib/routes";
import type { AdminNotification } from "@/types/notification";

const NOTIFICATION_TYPES: Array<AdminNotification["type"] | "all"> = [
  "all",
  "ticket",
  "return",
  "contact",
  "order",
  "system",
  "rental",
];

function NotificationsContent() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<AdminNotification["type"] | "all">("all");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      return adminFetchJson<{
        notifications: AdminNotification[];
        unreadCount: number;
      }>("/api/admin/notifications");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (payload: { id?: string; markAllRead?: boolean }) => {
      await adminMutateJson("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminMutateJson(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load notifications."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const notifications = (data?.notifications ?? []).filter(
    (item) => typeFilter === "all" || item.type === typeFilter,
  );

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <span>{data?.unreadCount ?? 0} unread</span>
        <select
          className="admin-select"
          style={{ width: "auto" }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AdminNotification["type"] | "all")}
        >
          {NOTIFICATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "all" ? "All types" : type}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={markReadMutation.isPending || (data?.unreadCount ?? 0) === 0}
          onClick={() => markReadMutation.mutate({ markAllRead: true })}
        >
          Mark all read
        </button>
        <MutationError error={markReadMutation.isError ? markReadMutation.error : null} />
        <MutationError error={deleteMutation.isError ? deleteMutation.error : null} />
      </div>
      {notifications.length === 0 ? (
        <EmptyState message="No admin notifications yet." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => {
                const href = item.link ? normalizeAdminNotificationLink(item.link) : null;
                return (
                  <tr key={item.id}>
                    <td>
                      {href ? <Link href={href}>{item.title}</Link> : item.title}
                      <div style={{ fontSize: "0.875rem", color: "var(--admin-muted)" }}>
                        {item.body}
                      </div>
                    </td>
                    <td>{item.type}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{item.read ? "Read" : "Unread"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {!item.read ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            onClick={() => markReadMutation.mutate({ id: item.id })}
                          >
                            Mark read
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Notifications">
          <NotificationsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

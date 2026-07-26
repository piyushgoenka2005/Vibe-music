"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState, LoadingState, formatDate } from "@/components/admin/AdminUi";
import { normalizeAdminNotificationLink } from "@/lib/routes";
import type { AdminNotification } from "@/types/notification";

function NotificationsContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        notifications: AdminNotification[];
        unreadCount: number;
      }>;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (payload: { id?: string; markAllRead?: boolean }) => {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const notifications = data?.notifications ?? [];

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <span>{data?.unreadCount ?? 0} unread</span>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={markReadMutation.isPending || (data?.unreadCount ?? 0) === 0}
          onClick={() => markReadMutation.mutate({ markAllRead: true })}
        >
          Mark all read
        </button>
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
                const href = item.link
                  ? normalizeAdminNotificationLink(item.link)
                  : null;
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
                      {!item.read ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          onClick={() => markReadMutation.mutate({ id: item.id })}
                        >
                          Mark read
                        </button>
                      ) : null}
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

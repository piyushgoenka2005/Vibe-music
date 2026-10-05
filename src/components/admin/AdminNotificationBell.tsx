"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminFetchJson } from "@/lib/admin/adminFetch";
import { ROUTES } from "@/lib/routes";

export default function AdminNotificationBell() {
  const { data } = useQuery({
    queryKey: ["admin-notifications-count"],
    queryFn: async () => {
      // Lightweight count endpoint — full list is only fetched by /admin/notifications.
      return adminFetchJson<{ unreadCount: number }>("/api/admin/notifications/count");
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      href={ROUTES.adminNotifications}
      className="admin-notification-bell"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      title="Notifications"
    >
      <span aria-hidden>🔔</span>
      {unread > 0 ? (
        <span className="admin-notification-bell__badge">{unread > 99 ? "99+" : unread}</span>
      ) : null}
    </Link>
  );
}

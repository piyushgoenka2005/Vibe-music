"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationPreferences, UserNotification } from "@/types/notification";

function NotificationsPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["account-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/account/notifications");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        notifications: UserNotification[];
        preferences: NotificationPreferences;
        unreadCount: number;
      }>;
    },
  });

  const prefsMutation = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      const res = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (input?: { id?: string; markAllRead?: boolean }) => {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input ?? { markAllRead: true }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-notifications"] });
    },
  });

  function handleNotificationOpen(item: UserNotification) {
    if (!item.read) {
      markReadMutation.mutate({ id: item.id });
    }
  }

  if (isLoading || !data) {
    return (
      <div>
        <h1 className="acct__section-title">
          <Bell size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
          Notifications
        </h1>
        <p className="acct__section-sub">Loading notifications…</p>
      </div>
    );
  }

  const preferenceItems = [
    { key: "orderUpdates" as const, title: "Order updates" },
    { key: "promotions" as const, title: "Deals & promotions" },
    { key: "productAlerts" as const, title: "Product alerts" },
    { key: "newsletter" as const, title: "Newsletter" },
  ];

  return (
    <div>
      <h1 className="acct__section-title">
        <Bell size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
        Notifications
      </h1>
      <p className="acct__section-sub">
        {data.unreadCount} unread notification{data.unreadCount === 1 ? "" : "s"}.
      </p>

      <section className="acct__card" style={{ marginBottom: "1.5rem" }}>
        <div className="acct__card-header">
          <h3 className="acct__card-title">Preferences</h3>
        </div>
        <div className="acct__card-body">
          {preferenceItems.map((item) => (
            <div key={item.key} className="acct__setting-row">
              <div className="acct__setting-info">
                <h4>{item.title}</h4>
              </div>
              <label className="acct__toggle">
                <input
                  type="checkbox"
                  checked={data.preferences[item.key]}
                  onChange={(e) =>
                    prefsMutation.mutate({ [item.key]: e.target.checked })
                  }
                />
                <span className="acct__toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 className="acct__card-title">Inbox</h3>
        <button
          type="button"
          className="acct__btn acct__btn--secondary"
          disabled={markReadMutation.isPending || data.unreadCount === 0}
          onClick={() => markReadMutation.mutate({ markAllRead: true })}
        >
          Mark all read
        </button>
      </div>

      {data.notifications.length === 0 ? (
        <p className="acct__section-sub">No notifications yet.</p>
      ) : (
        <div className="acct__card">
          <div className="acct__card-body">
            {data.notifications.map((item) => (
              <article
                key={item.id}
                className="acct__setting-row"
                style={{ opacity: item.read ? 0.7 : 1 }}
              >
                <div className="acct__setting-info">
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                  {item.link ? (
                    <Link
                      href={item.link}
                      onClick={() => handleNotificationOpen(item)}
                    >
                      View details
                    </Link>
                  ) : !item.read ? (
                    <button
                      type="button"
                      className="acct__btn acct__btn--secondary"
                      style={{ marginTop: "0.5rem" }}
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate({ id: item.id })}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountNotificationsPage() {
  return <NotificationsPanel />;
}

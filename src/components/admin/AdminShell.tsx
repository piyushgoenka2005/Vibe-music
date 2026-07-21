"use client";

import { useEffect } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import { useAdminUiStore } from "@/store/adminUiStore";
import type { AdminSession } from "@/types/admin";
import "@/components/admin/admin.css";

interface AdminShellProps {
  admin: AdminSession;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const MOBILE_ADMIN_MQ = "(max-width: 768px)";

export default function AdminShell({ admin, title, children, actions }: AdminShellProps) {
  const theme = useAdminUiStore((s) => s.theme);
  const sidebarCollapsed = useAdminUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAdminUiStore((s) => s.setSidebarCollapsed);

  // On phones, start with the drawer closed so content isn't covered.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_ADMIN_MQ);
    const sync = () => {
      if (mq.matches) setSidebarCollapsed(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [setSidebarCollapsed]);

  return (
    <div
      className={`admin-root admin-root--${theme}${sidebarCollapsed ? " admin-root--sidebar-collapsed" : ""}`}
    >
      <div className="admin-layout">
        <AdminSidebar admin={admin} collapsed={sidebarCollapsed} />
        {!sidebarCollapsed ? (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Close admin navigation"
            onClick={() => setSidebarCollapsed(true)}
          />
        ) : null}
        <div className="admin-main">
          <header className="admin-header">
            <div className="admin-header__left">
              <button
                type="button"
                className="admin-header__menu"
                aria-label={sidebarCollapsed ? "Open admin navigation" : "Close admin navigation"}
                aria-controls="admin-sidebar"
                aria-expanded={!sidebarCollapsed}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu size={20} aria-hidden />
              </button>
              <h1 className="admin-header__title">{title}</h1>
            </div>
            <div className="admin-header__actions">
              <AdminNotificationBell />
              <AdminThemeToggle />
              {actions}
            </div>
          </header>
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

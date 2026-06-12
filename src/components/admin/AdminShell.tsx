"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";
import { useAdminUiStore } from "@/store/adminUiStore";
import type { AdminSession } from "@/types/admin";
import "@/components/admin/admin.css";

interface AdminShellProps {
  admin: AdminSession;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AdminShell({ admin, title, children, actions }: AdminShellProps) {
  const theme = useAdminUiStore((s) => s.theme);
  const sidebarCollapsed = useAdminUiStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={`admin-root admin-root--${theme}${sidebarCollapsed ? " admin-root--sidebar-collapsed" : ""}`}
    >
      <div className="admin-layout">
        <AdminSidebar admin={admin} collapsed={sidebarCollapsed} />
        <div className="admin-main">
          <header className="admin-header">
            <div className="admin-header__left">
              <h1 className="admin-header__title">{title}</h1>
            </div>
            <div className="admin-header__actions">
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

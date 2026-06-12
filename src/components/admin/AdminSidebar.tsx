"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Ticket,
  Star,
  Warehouse,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import type { AdminSession } from "@/types/admin";
import { logout } from "@/services/auth/auth.service";
import { useAdminUiStore } from "@/store/adminUiStore";

const NAV_ITEMS = [
  { href: ROUTES.admin, label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: ROUTES.adminProducts, label: "Products", icon: Package, permission: "products:read" },
  { href: ROUTES.adminCategories, label: "Categories", icon: FolderTree, permission: "categories:read" },
  { href: ROUTES.adminOrders, label: "Orders", icon: ShoppingCart, permission: "orders:read" },
  { href: ROUTES.adminCustomers, label: "Customers", icon: Users, permission: "customers:read" },
  { href: ROUTES.adminCoupons, label: "Coupons", icon: Ticket, permission: "coupons:read" },
  { href: ROUTES.adminReviews, label: "Reviews", icon: Star, permission: "reviews:read" },
  { href: ROUTES.adminInventory, label: "Inventory", icon: Warehouse, permission: "inventory:read" },
  { href: ROUTES.adminAnalytics, label: "Analytics", icon: BarChart3, permission: "analytics:read" },
  { href: ROUTES.adminSettings, label: "Settings", icon: Settings, permission: "settings:read" },
  { href: ROUTES.adminBlog, label: "Blog", icon: FileText, permission: "settings:read" },
] as const;

interface AdminSidebarProps {
  admin: AdminSession;
  collapsed: boolean;
}

export default function AdminSidebar({ admin, collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = useAdminUiStore((s) => s.toggleSidebar);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await logout();
    router.replace(ROUTES.adminLogin);
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    admin.permissions.includes(item.permission as (typeof admin.permissions)[number])
  );

  return (
    <aside className={`admin-sidebar${collapsed ? " admin-sidebar--collapsed" : ""}`}>
      <div className="admin-sidebar__brand">
        {!collapsed ? (
          <Link href={ROUTES.admin} className="admin-sidebar__brand-text">
            Vibe <span>Music</span>
          </Link>
        ) : null}
        <button
          type="button"
          className="admin-sidebar__toggle"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== ROUTES.admin && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="admin-sidebar__link-icon" />
              <span className="admin-sidebar__link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        {!collapsed ? (
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-name">{admin.displayName}</div>
            <div className="admin-sidebar__user-role">{ADMIN_ROLE_LABELS[admin.role]}</div>
          </div>
        ) : null}
        <button
          type="button"
          className="admin-sidebar__link admin-sidebar__logout"
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={18} className="admin-sidebar__link-icon" />
          <span className="admin-sidebar__link-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

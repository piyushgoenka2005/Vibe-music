"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  ImageIcon,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Tag,
  RotateCcw,
  MessageCircleQuestion,
  UserCog,
  Shield,
  Headset,
  Bell,
  FilePenLine,
  Truck,
  KeyRound,
  Gift,
  GitCompare,
  Mail,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import type { AdminSession } from "@/types/admin";
import { useAuthStore } from "@/store/authStore";
import { useAdminUiStore } from "@/store/adminUiStore";

const NAV_ITEMS = [
  { href: ROUTES.admin, label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: ROUTES.adminProducts, label: "Products", icon: Package, permission: "products:read" },
  { href: ROUTES.adminCategories, label: "Categories", icon: FolderTree, permission: "categories:read" },
  { href: ROUTES.adminBrands, label: "Brands", icon: Tag, permission: "categories:read" },
  { href: ROUTES.adminOrders, label: "Orders", icon: ShoppingCart, permission: "orders:read" },
  { href: ROUTES.adminRentals, label: "Rentals", icon: KeyRound, permission: "rentals:read" },
  { href: ROUTES.adminGiveaway, label: "Giveaways", icon: Gift, permission: "giveaways:read" },
  { href: ROUTES.adminCompare, label: "Compare", icon: GitCompare, permission: "compare:read" },
  { href: ROUTES.adminReturns, label: "Returns", icon: RotateCcw, permission: "orders:read" },
  { href: ROUTES.adminSupport, label: "Support", icon: Headset, permission: "orders:read" },
  { href: ROUTES.adminCustomers, label: "Customers", icon: Users, permission: "customers:read" },
  { href: ROUTES.adminNewsletter, label: "Newsletter", icon: Mail, permission: "customers:read" },
  { href: ROUTES.adminCoupons, label: "Coupons", icon: Ticket, permission: "coupons:read" },
  { href: ROUTES.adminBanners, label: "Banners", icon: ImageIcon, permission: "banners:read" },
  { href: ROUTES.adminHomepage, label: "Homepage", icon: LayoutTemplate, permission: "homepage:read" },
  { href: ROUTES.adminReviews, label: "Reviews", icon: Star, permission: "reviews:read" },
  { href: ROUTES.adminQuestions, label: "Q&A", icon: MessageCircleQuestion, permission: "reviews:read" },
  { href: ROUTES.adminInventory, label: "Inventory", icon: Warehouse, permission: "inventory:read" },
  { href: ROUTES.adminAnalytics, label: "Analytics", icon: BarChart3, permission: "analytics:read" },
  { href: ROUTES.adminNotifications, label: "Notifications", icon: Bell, permission: "dashboard:read" },
  { href: ROUTES.adminAuditLogs, label: "Audit logs", icon: ScrollText, permission: "audit:read" },
  { href: ROUTES.adminUsers, label: "Admin users", icon: UserCog, permission: "admins:read" },
  { href: ROUTES.adminRoles, label: "Roles", icon: Shield, permission: "admins:read" },
  { href: ROUTES.adminCms, label: "CMS", icon: FilePenLine, permission: "settings:read" },
  { href: ROUTES.adminShipping, label: "Shipping zones", icon: Truck, permission: "settings:read" },
  { href: ROUTES.adminSettings, label: "Settings", icon: Settings, permission: "settings:read" },
  { href: ROUTES.adminBlog, label: "Blog", icon: FileText, permission: "blog:read" },
] as const;

interface AdminSidebarProps {
  admin: AdminSession;
  collapsed: boolean;
}

export default function AdminSidebar({ admin, collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = useAdminUiStore((s) => s.toggleSidebar);
  const setSidebarCollapsed = useAdminUiStore((s) => s.setSidebarCollapsed);

  function closeSidebarOnMobile() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) {
      setSidebarCollapsed(true);
    }
  }

  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.replace(ROUTES.adminLogin);
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    admin.permissions.includes(item.permission as (typeof admin.permissions)[number])
  );

  const showNotificationBadge = visibleItems.some(
    (item) => item.href === ROUTES.adminNotifications
  );

  const { data: notificationData } = useQuery({
    queryKey: ["admin-notifications-count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ unreadCount: number }>;
    },
    enabled: showNotificationBadge,
    refetchInterval: 60_000,
  });

  const unreadNotifications = notificationData?.unreadCount ?? 0;

  return (
    <aside
      id="admin-sidebar"
      className={`admin-sidebar${collapsed ? " admin-sidebar--collapsed" : ""}`}
    >
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
              onClick={closeSidebarOnMobile}
            >
              <Icon size={18} className="admin-sidebar__link-icon" />
              <span className="admin-sidebar__link-label">{item.label}</span>
              {item.href === ROUTES.adminNotifications && unreadNotifications > 0 ? (
                <span className="admin-sidebar__badge" aria-hidden>
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              ) : null}
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

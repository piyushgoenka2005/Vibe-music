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
  PanelBottom,
  ScrollText,
  Tag,
  RotateCcw,
  MessageCircleQuestion,
  UserCog,
  Shield,
  Headset,
  Bell,
  Truck,
  KeyRound,
  Gift,
  GitCompare,
  Mail,
  ListTree,
  Sliders,
  Languages,
  Images,
  TrendingUp,
  Receipt,
  Menu as MenuIcon,
  Search,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/permissions";
import type { AdminSession } from "@/types/admin";
import { useAuthStore } from "@/store/authStore";
import { useAdminUiStore } from "@/store/adminUiStore";
import { adminFetchJson } from "@/lib/admin/adminFetch";
import { notifyAdminUnauthorized } from "@/lib/admin/adminLiveSync";
import { setCachedAdminSession } from "@/components/admin/AdminGuard";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Catalog Management",
    items: [
      { href: ROUTES.adminProducts, label: "Products", icon: Package, permission: "products:read" },
      {
        href: ROUTES.adminCategories,
        label: "Categories",
        icon: FolderTree,
        permission: "categories:read",
      },
      {
        href: ROUTES.adminTaxonomy,
        label: "Master Taxonomy",
        icon: ListTree,
        permission: "categories:read",
      },
      {
        href: ROUTES.adminAttributes,
        label: "Attributes",
        icon: Sliders,
        permission: "categories:read",
      },
      { href: ROUTES.adminBrands, label: "Brands", icon: Tag, permission: "categories:read" },
    ],
  },
  {
    title: "Website Management",
    items: [
      {
        href: ROUTES.adminNavigation,
        label: "Header & Menu Management",
        icon: MenuIcon,
        permission: "settings:read",
      },
      {
        href: ROUTES.adminHomepage,
        label: "Homepage Sections",
        icon: LayoutTemplate,
        permission: "homepage:read",
      },
      { href: ROUTES.adminBanners, label: "Banners", icon: ImageIcon, permission: "banners:read" },
      {
        href: ROUTES.adminFooter,
        label: "Footer Management",
        icon: PanelBottom,
        permission: "settings:read",
      },
      { href: ROUTES.adminSeo, label: "SEO Management", icon: Search, permission: "settings:read" },
    ],
  },
  {
    title: "Business Management",
    items: [
      { href: ROUTES.adminOrders, label: "Orders", icon: ShoppingCart, permission: "orders:read" },
      {
        href: ROUTES.adminInventory,
        label: "Inventory",
        icon: Warehouse,
        permission: "inventory:read",
      },
      {
        href: ROUTES.adminCustomers,
        label: "Customers",
        icon: Users,
        permission: "customers:read",
      },
      { href: ROUTES.adminReturns, label: "Returns", icon: RotateCcw, permission: "orders:read" },
      {
        href: ROUTES.adminCoupons,
        label: "Coupons & Deals",
        icon: Ticket,
        permission: "coupons:read",
      },
    ],
  },
  {
    title: "Operations & Admin",
    items: [
      {
        href: ROUTES.admin,
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "dashboard:read",
      },
      { href: ROUTES.adminRentals, label: "Rentals", icon: KeyRound, permission: "rentals:read" },
      { href: ROUTES.adminReviews, label: "Reviews", icon: Star, permission: "reviews:read" },
      {
        href: ROUTES.adminQuestions,
        label: "Q&A",
        icon: MessageCircleQuestion,
        permission: "reviews:read",
      },
      {
        href: ROUTES.adminMedia,
        label: "Media Library",
        icon: Images,
        permission: "products:read",
      },
      { href: ROUTES.adminBlog, label: "Guides / Blog", icon: FileText, permission: "blog:read" },
      { href: ROUTES.adminGiveaway, label: "Giveaways", icon: Gift, permission: "giveaways:read" },
      { href: ROUTES.adminCompare, label: "Compare", icon: GitCompare, permission: "compare:read" },
      {
        href: ROUTES.adminNewsletter,
        label: "Newsletter",
        icon: Mail,
        permission: "customers:read",
      },
      { href: ROUTES.adminSupport, label: "Support", icon: Headset, permission: "orders:read" },
      {
        href: ROUTES.adminAnalytics,
        label: "Analytics",
        icon: BarChart3,
        permission: "analytics:read",
      },
      {
        href: ROUTES.adminReports,
        label: "Reports",
        icon: TrendingUp,
        permission: "analytics:read",
      },
      {
        href: ROUTES.adminNotifications,
        label: "Notifications",
        icon: Bell,
        permission: "dashboard:read",
      },
      {
        href: ROUTES.adminAuditLogs,
        label: "Audit logs",
        icon: ScrollText,
        permission: "audit:read",
      },
      { href: ROUTES.adminUsers, label: "Admin users", icon: UserCog, permission: "admins:read" },
      { href: ROUTES.adminRoles, label: "Roles", icon: Shield, permission: "admins:read" },
      {
        href: ROUTES.adminShipping,
        label: "Shipping zones",
        icon: Truck,
        permission: "settings:read",
      },
      { href: ROUTES.adminTax, label: "GST & Taxes", icon: Receipt, permission: "settings:read" },
      {
        href: ROUTES.adminLocalization,
        label: "Localization",
        icon: Languages,
        permission: "settings:read",
      },
      {
        href: ROUTES.adminSettings,
        label: "Settings",
        icon: Settings,
        permission: "settings:read",
      },
    ],
  },
];

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
    setCachedAdminSession(null);
    notifyAdminUnauthorized();
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    await logout();
    router.replace(ROUTES.adminLogin);
  }

  const isSuperAdmin = admin.role === "super_admin";

  const { data: notificationData } = useQuery({
    queryKey: ["admin-notifications-count"],
    queryFn: async () => {
      return adminFetchJson<{ unreadCount: number }>("/api/admin/notifications/count");
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
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
        {SECTIONS.map((section) => {
          const visibleSectionItems = section.items.filter(
            (item) =>
              isSuperAdmin ||
              (admin.permissions ?? []).includes(
                item.permission as (typeof admin.permissions)[number],
              ),
          );

          if (visibleSectionItems.length === 0) return null;

          return (
            <div key={section.title} className="admin-sidebar__section">
              {!collapsed ? (
                <div className="admin-sidebar__section-title">{section.title}</div>
              ) : null}

              {visibleSectionItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== ROUTES.admin && pathname.startsWith(item.href));

                return (
                  <Link
                    key={`${section.title}-${item.label}-${item.href}`}
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
            </div>
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

import { ROUTES } from "@/lib/routes";
import { hasPermission } from "@/lib/auth/permissions";
import type { Permission } from "@/types/admin";

/** Longest-prefix wins. Keep in sync with AdminSidebar NAV_ITEMS. */
const ADMIN_ROUTE_PERMISSIONS = (
  [
    { prefix: ROUTES.adminProductNew, permission: "products:read" },
    { prefix: ROUTES.adminProducts, permission: "products:read" },
    { prefix: ROUTES.adminCategories, permission: "categories:read" },
    { prefix: ROUTES.adminBrands, permission: "categories:read" },
    { prefix: ROUTES.adminOrders, permission: "orders:read" },
    { prefix: ROUTES.adminRentalProducts, permission: "rentals:read" },
    { prefix: ROUTES.adminRentalCategories, permission: "rentals:read" },
    { prefix: ROUTES.adminRentalBookings, permission: "rentals:read" },
    { prefix: ROUTES.adminRentalAnalytics, permission: "rentals:read" },
    { prefix: ROUTES.adminRentalPolicies, permission: "rentals:read" },
    { prefix: ROUTES.adminRentals, permission: "rentals:read" },
    { prefix: ROUTES.adminGiveawayCampaigns, permission: "giveaways:read" },
    { prefix: ROUTES.adminGiveaway, permission: "giveaways:read" },
    { prefix: ROUTES.adminCompare, permission: "compare:read" },
    { prefix: ROUTES.adminReturns, permission: "orders:read" },
    { prefix: ROUTES.adminSupport, permission: "orders:read" },
  { prefix: ROUTES.adminCustomers, permission: "customers:read" },
  { prefix: ROUTES.adminNewsletter, permission: "customers:read" },
  { prefix: ROUTES.adminCoupons, permission: "coupons:read" },
    { prefix: ROUTES.adminBanners, permission: "banners:read" },
    { prefix: ROUTES.adminHomepage, permission: "homepage:read" },
    { prefix: ROUTES.adminReviews, permission: "reviews:read" },
    { prefix: ROUTES.adminQuestions, permission: "reviews:read" },
    { prefix: ROUTES.adminInventory, permission: "inventory:read" },
    { prefix: ROUTES.adminAnalytics, permission: "analytics:read" },
    { prefix: ROUTES.adminNotifications, permission: "dashboard:read" },
    { prefix: ROUTES.adminAuditLogs, permission: "audit:read" },
    { prefix: ROUTES.adminUsers, permission: "admins:read" },
    { prefix: ROUTES.adminRoles, permission: "admins:read" },
    { prefix: ROUTES.adminCms, permission: "settings:write" },
    { prefix: ROUTES.adminShipping, permission: "settings:write" },
    { prefix: ROUTES.adminSettings, permission: "settings:read" },
    { prefix: ROUTES.adminBlog, permission: "blog:read" },
    { prefix: ROUTES.admin, permission: "dashboard:read" },
  ] as const satisfies ReadonlyArray<{ prefix: string; permission: Permission }>
)
  .slice()
  .sort((a, b) => b.prefix.length - a.prefix.length);

export function getRequiredPermissionForAdminPath(
  pathname: string
): Permission | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === ROUTES.adminLogin) return null;

  for (const rule of ADMIN_ROUTE_PERMISSIONS) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.permission;
    }
  }
  return "dashboard:read";
}

export function canAccessAdminPath(
  permissions: Permission[],
  pathname: string
): boolean {
  const required = getRequiredPermissionForAdminPath(pathname);
  if (!required) return true;
  return hasPermission(permissions, required);
}

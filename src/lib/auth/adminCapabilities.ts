import { hasPermission } from "@/lib/auth/permissions";
import type { Permission } from "@/types/admin";

/** UI capability flags derived from admin session permissions. */
export function getAdminCapabilities(permissions: Permission[]) {
  return {
    productsWrite: hasPermission(permissions, "products:write"),
    productsDelete: hasPermission(permissions, "products:delete"),
    ordersWrite: hasPermission(permissions, "orders:write"),
    ordersRefund: hasPermission(permissions, "orders:refund"),
    reviewsWrite: hasPermission(permissions, "reviews:write"),
    inventoryWrite: hasPermission(permissions, "inventory:write"),
    blogWrite: hasPermission(permissions, "blog:write"),
    blogDelete: hasPermission(permissions, "blog:delete"),
    rentalsWrite: hasPermission(permissions, "rentals:write"),
    settingsWrite: hasPermission(permissions, "settings:write"),
    couponsWrite: hasPermission(permissions, "coupons:write"),
    couponsDelete: hasPermission(permissions, "coupons:delete"),
    categoriesWrite: hasPermission(permissions, "categories:write"),
    categoriesDelete: hasPermission(permissions, "categories:delete"),
    customersWrite: hasPermission(permissions, "customers:write"),
    homepageWrite: hasPermission(permissions, "homepage:write"),
    bannersWrite: hasPermission(permissions, "banners:write"),
    bannersDelete: hasPermission(permissions, "banners:delete"),
    adminsWrite: hasPermission(permissions, "admins:write"),
    giveawaysWrite: hasPermission(permissions, "giveaways:write"),
    giveawaysDelete: hasPermission(permissions, "giveaways:delete"),
  };
}

export type AdminCapabilities = ReturnType<typeof getAdminCapabilities>;

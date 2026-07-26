import type { AdminRole, Permission } from "@/types/admin";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "products:read",
  "products:write",
  "products:delete",
  "categories:read",
  "categories:write",
  "categories:delete",
  "orders:read",
  "orders:write",
  "orders:refund",
  "customers:read",
  "customers:write",
  "coupons:read",
  "coupons:write",
  "coupons:delete",
  "reviews:read",
  "reviews:write",
  "inventory:read",
  "inventory:write",
  "analytics:read",
  "settings:read",
  "settings:write",
  "banners:read",
  "banners:write",
  "banners:delete",
  "homepage:read",
  "homepage:write",
  "blog:read",
  "blog:write",
  "blog:delete",
  "admins:read",
  "admins:write",
  "audit:read",
  "rentals:read",
  "rentals:write",
  "rentals:delete",
  "giveaways:read",
  "giveaways:write",
  "giveaways:delete",
  "compare:read",
];

export const EDITABLE_ADMIN_ROLES: AdminRole[] = [
  "admin",
  "inventory_manager",
  "customer_support",
];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: [
    "dashboard:read",
    "products:read",
    "products:write",
    "products:delete",
    "categories:read",
    "categories:write",
    "categories:delete",
    "orders:read",
    "orders:write",
    "orders:refund",
    "customers:read",
    "customers:write",
    "coupons:read",
    "coupons:write",
    "coupons:delete",
    "reviews:read",
    "reviews:write",
    "inventory:read",
    "inventory:write",
    "analytics:read",
    "settings:read",
    "settings:write",
    "banners:read",
    "banners:write",
    "banners:delete",
    "homepage:read",
    "homepage:write",
    "blog:read",
    "blog:write",
    "blog:delete",
    "rentals:read",
    "rentals:write",
    "rentals:delete",
    "giveaways:read",
    "giveaways:write",
    "giveaways:delete",
    "compare:read",
  ],
  inventory_manager: [
    "dashboard:read",
    "products:read",
    "products:write",
    "categories:read",
    "categories:write",
    "inventory:read",
    "inventory:write",
    "analytics:read",
    "rentals:read",
    "rentals:write",
  ],
  customer_support: [
    "dashboard:read",
    "orders:read",
    "orders:write",
    "customers:read",
    "reviews:read",
    "reviews:write",
    "rentals:read",
    "rentals:write",
    "giveaways:read",
  ],
};

/** Built-in defaults (ignores DB overrides). Prefer resolvePermissionsForRole on the server. */
export function getDefaultPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Sync defaults — server sessions should use resolvePermissionsForRole. */
export function getPermissionsForRole(role: AdminRole): Permission[] {
  return getDefaultPermissionsForRole(role);
}

export function hasPermission(
  permissions: Permission[],
  required: Permission
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: Permission[],
  required: Permission[]
): boolean {
  return required.some((p) => permissions.includes(p));
}

export function canAccessRoute(
  permissions: Permission[],
  routePermission: Permission
): boolean {
  return hasPermission(permissions, routePermission);
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  inventory_manager: "Inventory Manager",
  customer_support: "Customer Support",
};

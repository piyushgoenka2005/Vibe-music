import type { AdminRole, Permission } from "@/types/admin";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
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
    "admins:read",
    "admins:write",
  ],
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
  ],
  customer_support: [
    "dashboard:read",
    "orders:read",
    "orders:write",
    "customers:read",
    "reviews:read",
    "reviews:write",
  ],
};

export function getPermissionsForRole(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
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

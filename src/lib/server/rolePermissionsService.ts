import "server-only";

import {
  EDITABLE_ADMIN_ROLES,
  getDefaultPermissionsForRole,
} from "@/lib/auth/permissions";
import {
  deleteRolePermissionOverride,
  getRolePermissionOverride,
  listRolePermissionOverrides,
  upsertRolePermissionOverride,
} from "@/lib/server/rolePermissionsRepository";
import type { AdminRole, Permission } from "@/types/admin";

export async function resolvePermissionsForRole(
  role: AdminRole
): Promise<Permission[]> {
  if (role === "super_admin") {
    return getDefaultPermissionsForRole(role);
  }
  const override = await getRolePermissionOverride(role);
  return override ?? getDefaultPermissionsForRole(role);
}

export async function getRolePermissionsMatrix(): Promise<{
  defaults: Record<AdminRole, Permission[]>;
  overrides: Partial<Record<AdminRole, Permission[]>>;
  effective: Record<AdminRole, Permission[]>;
  editableRoles: AdminRole[];
}> {
  const roles = Object.keys(
    {
      super_admin: true,
      admin: true,
      inventory_manager: true,
      customer_support: true,
    } satisfies Record<AdminRole, true>
  ) as AdminRole[];

  const overrides = await listRolePermissionOverrides();
  const defaults = Object.fromEntries(
    roles.map((role) => [role, getDefaultPermissionsForRole(role)])
  ) as Record<AdminRole, Permission[]>;

  const effective = Object.fromEntries(
    roles.map((role) => [
      role,
      role === "super_admin"
        ? defaults[role]
        : (overrides[role] ?? defaults[role]),
    ])
  ) as Record<AdminRole, Permission[]>;

  return {
    defaults,
    overrides,
    effective,
    editableRoles: [...EDITABLE_ADMIN_ROLES],
  };
}

export async function saveRolePermissions(
  role: AdminRole,
  permissions: Permission[],
  updatedBy?: string | null
): Promise<Permission[]> {
  if (!EDITABLE_ADMIN_ROLES.includes(role)) {
    throw new Error("This role cannot be edited");
  }
  return upsertRolePermissionOverride({ role, permissions, updatedBy });
}

export async function resetRolePermissions(role: AdminRole): Promise<void> {
  if (!EDITABLE_ADMIN_ROLES.includes(role)) {
    throw new Error("This role cannot be reset");
  }
  await deleteRolePermissionOverride(role);
}

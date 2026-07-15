import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import type { AdminRole, Permission } from "@/types/admin";
import { ALL_PERMISSIONS } from "@/lib/auth/permissions";

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

function normalizePermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<Permission>();
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    if (!PERMISSION_SET.has(entry)) continue;
    seen.add(entry as Permission);
  }
  return Array.from(seen);
}

export async function getRolePermissionOverride(
  role: AdminRole
): Promise<Permission[] | null> {
  try {
    const row = await prisma.adminRolePermissionOverride.findUnique({
      where: { role },
    });
    if (!row) return null;
    return normalizePermissions(row.permissions);
  } catch {
    return null;
  }
}

export async function listRolePermissionOverrides(): Promise<
  Partial<Record<AdminRole, Permission[]>>
> {
  try {
    const rows = await prisma.adminRolePermissionOverride.findMany();
    const result: Partial<Record<AdminRole, Permission[]>> = {};
    for (const row of rows) {
      result[row.role as AdminRole] = normalizePermissions(row.permissions);
    }
    return result;
  } catch {
    return {};
  }
}

export async function upsertRolePermissionOverride(input: {
  role: AdminRole;
  permissions: Permission[];
  updatedBy?: string | null;
}): Promise<Permission[]> {
  const permissions = normalizePermissions(input.permissions);
  const updatedAt = new Date().toISOString();
  await prisma.adminRolePermissionOverride.upsert({
    where: { role: input.role },
    create: {
      role: input.role,
      permissions: asJsonValue(permissions),
      updatedAt,
      updatedBy: input.updatedBy ?? null,
    },
    update: {
      permissions: asJsonValue(permissions),
      updatedAt,
      updatedBy: input.updatedBy ?? null,
    },
  });
  return permissions;
}

export async function deleteRolePermissionOverride(role: AdminRole): Promise<void> {
  await prisma.adminRolePermissionOverride.deleteMany({ where: { role } });
}

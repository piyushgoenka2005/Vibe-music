import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { ALL_PERMISSIONS, EDITABLE_ADMIN_ROLES } from "@/lib/auth/permissions";
import {
  getRolePermissionsMatrix,
  resetRolePermissions,
  saveRolePermissions,
} from "@/lib/server/rolePermissionsService";
import type { AdminRole, Permission } from "@/types/admin";

const updateSchema = z.object({
  role: z.enum(["admin", "inventory_manager", "customer_support"]),
  permissions: z.array(z.string()).optional(),
  reset: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin("admins:read");
    const matrix = await getRolePermissionsMatrix();
    return NextResponse.json({
      ...matrix,
      allPermissions: ALL_PERMISSIONS,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin("admins:write", request);
    const body = updateSchema.parse(await request.json());
    const role = body.role as AdminRole;

    if (!EDITABLE_ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Role is not editable" }, { status: 400 });
    }

    if (body.reset) {
      await resetRolePermissions(role);
      const matrix = await getRolePermissionsMatrix();
      return NextResponse.json({ ok: true, matrix });
    }

    const permissions = (body.permissions ?? []).filter((p): p is Permission =>
      ALL_PERMISSIONS.includes(p as Permission)
    );

    await saveRolePermissions(role, permissions, admin.uid);
    const matrix = await getRolePermissionsMatrix();
    return NextResponse.json({ ok: true, matrix });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

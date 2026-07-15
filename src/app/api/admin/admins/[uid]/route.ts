import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  countActiveSuperAdmins,
  getAdminRecord,
  updateAdminProfile,
} from "@/lib/server/adminService";
import { updateUserPassword } from "@/lib/server/userService";
import { adminUserUpdateSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ uid: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("admins:read");
    const { uid } = await context.params;
    const admin = await getAdminRecord(uid);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ admin });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin("admins:write", request);
    const { uid } = await context.params;
    const body = await request.json();
    const parsed = adminUserUpdateSchema.parse(body);

    const current = await getAdminRecord(uid);
    if (!current) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (uid === session.uid && parsed.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const demotingSuperAdmin =
      current.role === "super_admin" &&
      current.isActive &&
      ((parsed.isActive === false) ||
        (parsed.role !== undefined && parsed.role !== "super_admin"));

    if (demotingSuperAdmin) {
      const superCount = await countActiveSuperAdmins();
      if (superCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove or demote the last active Super Admin" },
          { status: 400 }
        );
      }
    }

    const { password, ...profilePatch } = parsed;
    const admin = await updateAdminProfile(uid, profilePatch);

    if (password) {
      await updateUserPassword(uid, password);
    }

    return NextResponse.json({
      admin,
      passwordUpdated: Boolean(password),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

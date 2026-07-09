import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getAdminProfile,
  updateAdminProfile,
} from "@/lib/server/adminService";
import { adminUserUpdateSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ uid: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("admins:read");
    const { uid } = await context.params;
    const admin = await getAdminProfile(uid);
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

    if (uid === session.uid && parsed.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const admin = await updateAdminProfile(uid, parsed);
    return NextResponse.json({ admin });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

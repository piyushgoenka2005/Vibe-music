import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { updateAdminLastLogin } from "@/lib/server/adminService";

export async function GET() {
  try {
    const admin = await requireAdmin();
    return NextResponse.json({ admin });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST() {
  try {
    const admin = await requireAdmin();
    await updateAdminLastLogin(admin.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

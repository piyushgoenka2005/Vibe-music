import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAdmins } from "@/lib/server/adminService";

export async function GET() {
  try {
    await requireAdmin("admins:read");
    const admins = await listAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

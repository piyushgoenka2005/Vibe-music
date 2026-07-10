import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createAdminProfile,
  listAdmins,
} from "@/lib/server/adminService";
import { getAdminAuth } from "@/lib/firebase/admin";
import { adminInviteSchema } from "@/lib/validations/wrFeatures";

export async function GET() {
  try {
    await requireAdmin("admins:read");
    const admins = await listAdmins();
    return NextResponse.json({ admins });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("admins:write", request);
    const body = await request.json();
    const parsed = adminInviteSchema.parse(body);

    const auth = getAdminAuth();
    const existing = await auth.getUserByEmail(parsed.email).catch(() => null);
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const userRecord = await auth.createUser({
      email: parsed.email,
      password: parsed.password,
      displayName: parsed.displayName,
      emailVerified: true,
    });

    const admin = await createAdminProfile(userRecord.uid, {
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

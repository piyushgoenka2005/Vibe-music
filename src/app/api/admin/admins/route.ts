import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createAdminProfile,
  listAdmins,
} from "@/lib/server/adminService";
import { createAuthUser, findUserByEmail } from "@/lib/server/userService";
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

    const existing = await findUserByEmail(parsed.email);
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const user = await createAuthUser({
      email: parsed.email,
      password: parsed.password,
      name: parsed.displayName,
    });

    const admin = await createAdminProfile(user.id, {
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

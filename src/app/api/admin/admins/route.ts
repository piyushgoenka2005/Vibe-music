import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createAdminProfile,
  getAdminRecord,
  listAdmins,
  updateAdminProfile,
} from "@/lib/server/adminService";
import {
  createAuthUser,
  findUserByEmail,
  updateUserDisplayName,
  updateUserPassword,
} from "@/lib/server/userService";
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
    const actor = await requireAdmin("admins:write", request);
    const body = await request.json();
    const parsed = adminInviteSchema.parse(body);

    if (parsed.role === "super_admin" && actor.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can invite another Super Admin" },
        { status: 403 }
      );
    }

    const email = parsed.email.trim().toLowerCase();

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      const existingAdmin = await getAdminRecord(existingUser.id);
      if (existingAdmin) {
        if (existingAdmin.isActive) {
          return NextResponse.json(
            { error: "This email is already an admin user" },
            { status: 409 }
          );
        }
        // Reactivate previously deactivated admin
        const admin = await updateAdminProfile(existingUser.id, {
          displayName: parsed.displayName,
          role: parsed.role,
          isActive: true,
        });
        if (parsed.password) {
          await updateUserPassword(existingUser.id, parsed.password);
        }
        await updateUserDisplayName(existingUser.id, parsed.displayName);
        return NextResponse.json({
          admin,
          mode: "reactivated" as const,
        });
      }

      // Promote existing storefront / OAuth user to admin
      if (parsed.password) {
        await updateUserPassword(existingUser.id, parsed.password);
      }
      await updateUserDisplayName(existingUser.id, parsed.displayName);

      const admin = await createAdminProfile(existingUser.id, {
        email,
        displayName: parsed.displayName,
        role: parsed.role,
      });

      return NextResponse.json(
        { admin, mode: "promoted" as const },
        { status: 201 }
      );
    }

    if (!parsed.password) {
      return NextResponse.json(
        {
          error:
            "Password is required when creating a new admin account (email is not registered yet)",
        },
        { status: 400 }
      );
    }

    const user = await createAuthUser({
      email,
      password: parsed.password,
      name: parsed.displayName,
    });

    const admin = await createAdminProfile(user.id, {
      email,
      displayName: parsed.displayName,
      role: parsed.role,
    });

    return NextResponse.json(
      { admin, mode: "created" as const },
      { status: 201 }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

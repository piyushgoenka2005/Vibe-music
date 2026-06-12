import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { hasPermission } from "@/lib/auth/permissions";
import type { AdminSession, Permission } from "@/types/admin";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 = 403
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(
  permission?: Permission
): Promise<AdminSession> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new AdminAuthError("Authentication required", 401);
  }

  const adminSession = await getAdminSession(sessionUser.uid);
  if (!adminSession) {
    throw new AdminAuthError("Admin access denied", 403);
  }

  if (permission && !hasPermission(adminSession.permissions, permission)) {
    throw new AdminAuthError("Insufficient permissions", 403);
  }

  return adminSession;
}

export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

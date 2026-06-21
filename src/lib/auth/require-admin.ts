import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { isMutationMethod } from "@/lib/security/mutation-origin";
import { getAdminSession } from "@/lib/server/adminService";
import { logAuditEvent } from "@/lib/server/auditLog";
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
  permission?: Permission,
  request?: Request
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

  if (request && isMutationMethod(request.method)) {
    const { pathname } = new URL(request.url);
    void logAuditEvent({
      action: `admin.${request.method.toLowerCase()}`,
      actorId: adminSession.uid,
      actorEmail: adminSession.email,
      resourceType: "admin_api",
      resourceId: pathname,
      request,
      metadata: {
        permission: permission ?? null,
      },
    });
  }

  return adminSession;
}

export function adminErrorResponse(error: unknown, request?: Request): NextResponse {
  if (error instanceof AdminAuthError) {
    const response = NextResponse.json({ error: error.message }, { status: error.status });
    if (request) {
      response.headers.set(
        "x-request-id",
        request.headers.get("x-request-id") ?? ""
      );
    }
    return response;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

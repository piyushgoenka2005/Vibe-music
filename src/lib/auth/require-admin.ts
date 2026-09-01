import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "@/lib/auth/server-session";
import { isMutationMethod } from "@/lib/security/mutation-origin";
import { getAdminSession } from "@/lib/server/adminService";
import { logAuditEvent } from "@/lib/server/auditLog";
import { hasPermission } from "@/lib/auth/permissions";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { distributedCheckRateLimit } from "@/lib/security/distributed-rate-limit";
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

export class AdminRateLimitError extends Error {
  public readonly limit: number;
  public readonly remaining: number;
  public readonly resetAt: number;

  constructor(limit: number, remaining: number, resetAt: number) {
    super("Too many requests. Please try again later.");
    this.name = "AdminRateLimitError";
    this.limit = limit;
    this.remaining = remaining;
    this.resetAt = resetAt;
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

  // Rate-limit per admin UID (not IP) so shared-NAT admins don't
  // exhaust each other's budget. Runs after auth so unauthenticated
  // requests never consume the admin rate-limit bucket.
  if (request) {
    const result = await distributedCheckRateLimit(
      `admin:${adminSession.uid}`,
      RATE_LIMITS.admin
    );
    if (!result.allowed) {
      throw new AdminRateLimitError(
        RATE_LIMITS.admin.limit,
        result.remaining,
        result.resetAt
      );
    }
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
  if (error instanceof AdminRateLimitError) {
    const response = NextResponse.json(
      { error: error.message },
      { status: 429 }
    );
    response.headers.set("X-RateLimit-Limit", String(error.limit));
    response.headers.set("X-RateLimit-Remaining", String(error.remaining));
    response.headers.set("X-RateLimit-Reset", String(error.resetAt));
    if (request) {
      response.headers.set(
        "x-request-id",
        request.headers.get("x-request-id") ?? ""
      );
    }
    return response;
  }
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
  if (error instanceof ZodError) {
    const message =
      error.issues[0]?.message?.trim() || "Invalid request";
    return NextResponse.json(
      {
        error: message,
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  // Avoid leaking internal exception details to admin clients.
  console.error("[admin]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

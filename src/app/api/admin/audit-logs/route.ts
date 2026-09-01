import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/require-admin";
import { listRecentAuditLogs } from "@/lib/server/auditLog";
import { checkRateLimit } from "@/lib/security/rate-limit-core";
import { getClientIp } from "@/lib/security/rate-limit";

/** Tighter per-IP cap (60/min) on top of the per-admin-UID cap (200/min)
 *  enforced inside requireAdmin, because audit log queries are expensive. */
const AUDIT_LOGS_RATE_LIMIT = { limit: 60, windowMs: 60_000 } as const;

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(
      `audit-logs-get:${ip}`,
      AUDIT_LOGS_RATE_LIMIT
    );

    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    await requireAdmin("audit:read", request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(10, Number(searchParams.get("limit") ?? "100") || 100)
    );
    const cursor = searchParams.get("cursor") ?? undefined;

    const result = await listRecentAuditLogs(limit, cursor);
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/require-admin";
import { listRecentAuditLogs } from "@/lib/server/auditLog";

export async function GET(request: Request) {
  try {
    await requireAdmin("audit:read", request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      200,
      Math.max(10, Number(searchParams.get("limit") ?? "100") || 100)
    );

    const logs = await listRecentAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

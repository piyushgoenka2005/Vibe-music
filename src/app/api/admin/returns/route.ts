import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listReturnRequestsPage } from "@/lib/server/returnRequestRepository";
import type { ReturnRequestStatus } from "@/types/returnRequest";

const VALID_STATUSES = new Set<ReturnRequestStatus>([
  "pending",
  "approved",
  "rejected",
  "received",
  "refunded",
  "cancelled",
]);

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam && VALID_STATUSES.has(statusParam as ReturnRequestStatus)
        ? (statusParam as ReturnRequestStatus)
        : undefined;
    const limit = Number(searchParams.get("limit") ?? 20);
    const cursor = searchParams.get("cursor") ?? undefined;

    const page = await listReturnRequestsPage({
      status,
      limit,
      afterCreatedAt: cursor,
    });

    return NextResponse.json(page);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

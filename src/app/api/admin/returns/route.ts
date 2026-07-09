import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listReturnRequests } from "@/lib/server/returnRequestRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const returns = await listReturnRequests({
      status: status as import("@/types/returnRequest").ReturnRequestStatus | undefined,
      limit: 100,
    });
    return NextResponse.json({ returns });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

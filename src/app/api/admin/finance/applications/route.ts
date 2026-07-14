import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllFinanceApplications } from "@/lib/server/financeRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("finance:read");
    const { searchParams } = new URL(request.url);
    const applications = await listAllFinanceApplications({
      status: searchParams.get("status") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 100),
    });
    return NextResponse.json({ applications });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getFinanceAnalyticsSummary } from "@/lib/server/financeRepository";

export async function GET() {
  try {
    await requireAdmin("finance:read");
    const analytics = await getFinanceAnalyticsSummary();
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

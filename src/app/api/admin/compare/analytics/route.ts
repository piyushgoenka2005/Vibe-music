import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getCompareAnalyticsSummary } from "@/lib/server/compareRepository";

export async function GET() {
  try {
    await requireAdmin("compare:read");
    const analytics = await getCompareAnalyticsSummary();
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

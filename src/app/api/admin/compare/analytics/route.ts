import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getCompareAnalyticsSummary } from "@/lib/server/compareRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("compare:read");
    const period = new URL(request.url).searchParams.get("period") ?? "30d";
    const analytics = await getCompareAnalyticsSummary(period);
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

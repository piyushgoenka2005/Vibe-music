import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getSearchAnalyticsDashboard } from "@/lib/server/searchAnalyticsService";

export async function GET(request: Request) {
  try {
    await requireAdmin("analytics:read");
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";
    const dashboard = await getSearchAnalyticsDashboard(period);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

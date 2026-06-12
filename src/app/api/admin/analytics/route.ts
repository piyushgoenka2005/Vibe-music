import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getAnalyticsReport } from "@/lib/server/settingsService";

export async function GET(request: Request) {
  try {
    await requireAdmin("analytics:read");
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";
    const report = await getAnalyticsReport(period);
    return NextResponse.json({ report });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

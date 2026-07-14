import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getGiveawayAnalyticsSummary } from "@/lib/server/giveawayRepository";

export async function GET() {
  try {
    await requireAdmin("giveaways:read");
    const analytics = await getGiveawayAnalyticsSummary();
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

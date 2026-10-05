import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listGiveawayEntriesForCampaignPage } from "@/lib/server/giveawayRepository";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin("giveaways:read", request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = await listGiveawayEntriesForCampaignPage(id, {
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      entries: page.entries,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

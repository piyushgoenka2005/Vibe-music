import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listGiveawayEntriesForCampaign } from "@/lib/server/giveawayRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("giveaways:read");
    const { id } = await params;
    const entries = await listGiveawayEntriesForCampaign(id);
    return NextResponse.json({ entries });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

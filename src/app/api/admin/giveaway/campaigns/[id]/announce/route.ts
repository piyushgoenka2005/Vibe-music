import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { announceGiveawayWinners } from "@/lib/server/giveawayEntryService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin("giveaways:write");
    const { id } = await params;
    const winners = await announceGiveawayWinners({
      campaignId: id,
      actorId: admin.uid,
      actorEmail: admin.email,
      request,
    });
    return NextResponse.json({ winners });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

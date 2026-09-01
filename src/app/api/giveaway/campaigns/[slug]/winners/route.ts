import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getGiveawayCampaignBySlug, listGiveawayWinnersForCampaign } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rl = await enforceRateLimit(request, "giveaway-winners", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { slug } = await params;
    const campaign = await getGiveawayCampaignBySlug(slug);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (!campaign.winnersAnnounced) {
      return NextResponse.json({ winners: [] });
    }
    const winners = await listGiveawayWinnersForCampaign(campaign.id);
    const publicWinners = winners.map((w) => ({
      rank: w.rank,
      entryNumber: w.entry?.entryNumber,
      customerName: w.entry?.customerName,
      announcedAt: w.announcedAt,
    }));
    return NextResponse.json({ winners: publicWinners });
  } catch (error) {
    return publicApiError(error, "Failed to load winners");
  }
}

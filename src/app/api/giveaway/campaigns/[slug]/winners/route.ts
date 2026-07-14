import { NextResponse } from "next/server";
import {
  getGiveawayCampaignBySlug,
  listGiveawayWinnersForCampaign,
} from "@/lib/server/giveawayRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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
}

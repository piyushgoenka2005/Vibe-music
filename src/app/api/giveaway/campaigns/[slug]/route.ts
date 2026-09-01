import { NextResponse } from "next/server";
import { getGiveawayCampaignBySlug } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const campaign = await getGiveawayCampaignBySlug(slug);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    return publicApiError(error, "Failed to load campaign");
  }
}

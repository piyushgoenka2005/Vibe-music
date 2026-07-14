import { NextResponse } from "next/server";
import { listPublicGiveawayCampaigns } from "@/lib/server/giveawayRepository";

export async function GET() {
  const campaigns = await listPublicGiveawayCampaigns();
  return NextResponse.json({ campaigns });
}

import { NextResponse } from "next/server";
import { listPublicGiveawayCampaigns } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET() {
  try {
    const campaigns = await listPublicGiveawayCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return publicApiError(error, "Failed to load campaigns");
  }
}

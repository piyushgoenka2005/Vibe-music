import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { listPublicGiveawayCampaigns } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "giveaway-campaigns", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const campaigns = await listPublicGiveawayCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return publicApiError(error, "Failed to load campaigns");
  }
}

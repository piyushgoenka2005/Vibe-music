import { NextResponse } from "next/server";
import { giveawaySocialClaimSchema } from "@/lib/validations/giveaway";
import { claimGiveawaySocialBonus } from "@/lib/server/giveawayEntryService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { publicApiError } from "@/lib/server/publicApiError";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await enforceRateLimit(request, "giveaway-social", RATE_LIMITS.checkout);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const body = await request.json();
    const parsed = giveawaySocialClaimSchema.parse(body);
    const { searchParams } = new URL(request.url);
    const trackingToken = searchParams.get("trackingToken") ?? undefined;

    const entry = await claimGiveawaySocialBonus(id, parsed.platform, trackingToken);
    return NextResponse.json({ entry });
  } catch (error) {
    return publicApiError(error, "Claim failed");
  }
}

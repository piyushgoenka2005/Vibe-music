import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getRentalPolicy } from "@/lib/server/rentalRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "rental-policy", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const policy = await getRentalPolicy();
    return NextResponse.json({ policy });
  } catch (error) {
    return publicApiError(error, "Failed to load policy");
  }
}

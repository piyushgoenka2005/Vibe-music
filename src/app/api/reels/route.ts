import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { listReels } from "@/lib/server/gearStoryService";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "reels", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const data = await listReels();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return publicApiError(error, "Unable to load gear stories");
  }
}

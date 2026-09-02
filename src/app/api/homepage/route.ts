import { NextResponse } from "next/server";
import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "homepage", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const data = await getCachedPublicHomepageData();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
      },
    });
  } catch (error) {
    console.error("[api/homepage] Error:", error);
    return NextResponse.json({ error: "Failed to load homepage data" }, { status: 500 });
  }
}

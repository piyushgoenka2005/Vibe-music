import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { loadSharedCompare } from "@/lib/server/compareService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const rl = await enforceRateLimit(request, "compare-share", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { token } = await params;
    const share = await loadSharedCompare(token);
    return NextResponse.json({ share });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}

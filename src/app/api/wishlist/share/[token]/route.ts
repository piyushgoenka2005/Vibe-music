import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { loadSharedWishlist } from "@/lib/server/wishlistShareService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const rl = await enforceRateLimit(request, "wishlist-share", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { token } = await params;
    const share = await loadSharedWishlist(token);
    return NextResponse.json({ share });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}

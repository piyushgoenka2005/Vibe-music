import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { handleRouteError } from "@/lib/api/route-utils";
import { MAX_ACTIVE_COUPON_PRODUCT_IDS } from "@/lib/coupons/activeCouponsQuery";
import { listActiveCouponsForStorefront } from "@/lib/server/couponService";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "coupons-active", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim() || undefined;
    const productIds = searchParams
      .get("productIds")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, MAX_ACTIVE_COUPON_PRODUCT_IDS);
    const coupons = await listActiveCouponsForStorefront({ productId, productIds });
    return NextResponse.json(
      { coupons },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    return handleRouteError(error, "api/coupons/active", request);
  }
}

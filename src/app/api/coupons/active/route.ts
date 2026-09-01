import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { handleRouteError } from "@/lib/api/route-utils";
import { listActiveCouponsForStorefront } from "@/lib/server/couponService";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "coupons-active", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const coupons = await listActiveCouponsForStorefront();
    return NextResponse.json(
      { coupons },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/coupons/active", request);
  }
}

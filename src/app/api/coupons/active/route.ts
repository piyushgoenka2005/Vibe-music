import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/route-utils";
import { listActiveCouponsForStorefront } from "@/lib/server/couponService";

export async function GET(request: Request) {
  try {
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

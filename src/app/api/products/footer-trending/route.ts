import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { getFooterTrendingProducts } from "@/lib/server/footerTrendingService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "products-footer-trending",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const products = await getFooterTrendingProducts(
      Number.isFinite(limit) && limit && limit > 0 ? limit : undefined
    );

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/products/footer-trending");
  }
}

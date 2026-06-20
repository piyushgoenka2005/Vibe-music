import { NextResponse } from "next/server";
import { enforceRateLimit, handleRouteError } from "@/lib/api/route-utils";
import { getProductSummaries } from "@/services/catalogService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const MAX_IDS = 24;

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "products-summaries",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const ids = [...new Set(
      (searchParams.get("ids") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    )];

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `At most ${MAX_IDS} product ids allowed` },
        { status: 400 }
      );
    }

    const products = await getProductSummaries(ids);

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/products/summaries");
  }
}

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { handleRouteError, jsonError } from "@/lib/api/route-utils";
import { getProductDetailBySlug } from "@/services/catalogService";
import { getProductReviewStats } from "@/lib/server/reviewService";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const rl = await enforceRateLimit(request, "review-stats", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const stats = await getProductReviewStats(product.id);
    return NextResponse.json({ stats }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/products/[slug]/reviews/stats");
  }
}

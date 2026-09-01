import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getSessionUser } from "@/lib/auth/server-session";
import { handleRouteError, jsonError } from "@/lib/api/route-utils";
import { getProductDetailBySlug } from "@/services/catalogService";
import { getReviewEligibility } from "@/lib/server/reviewService";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const rl = await enforceRateLimit(request, "review-eligibility", RATE_LIMITS.auth);
    if (rl) return rl;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const eligibility = await getReviewEligibility(
      sessionUser.uid,
      sessionUser.email,
      product.id
    );

    return NextResponse.json({ eligibility });
  } catch (error) {
    return handleRouteError(error, "GET /api/products/[slug]/reviews/eligibility");
  }
}

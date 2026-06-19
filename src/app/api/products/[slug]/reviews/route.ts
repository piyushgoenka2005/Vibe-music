import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { getProductDetailBySlug } from "@/services/catalogService";
import {
  listReviewsForProduct,
  submitProductReview,
} from "@/lib/server/reviewService";
import { createReviewSchema, reviewListQuerySchema } from "@/lib/validations/review";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const { searchParams } = new URL(request.url);
    const parsed = reviewListQuerySchema.safeParse({
      sort: searchParams.get("sort") ?? undefined,
      rating: searchParams.get("rating") ?? undefined,
      verified: searchParams.get("verified") ?? undefined,
      hasImages: searchParams.get("hasImages") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const sessionUser = await getSessionUser();
    const result = await listReviewsForProduct({
      productId: product.id,
      ...parsed.data,
      viewerUserId: sessionUser?.uid,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/products/[slug]/reviews");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimited = await enforceRateLimit(request, "review-submit", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const csrf = enforceMutationSecurity(request);
    if (csrf) return csrf;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const body = await parseJsonBody(request, createReviewSchema);
    if ("error" in body) return body.error;

    const review = await submitProductReview({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      userId: sessionUser.uid,
      userEmail: sessionUser.email ?? undefined,
      author: sessionUser.name ?? sessionUser.email ?? "Customer",
      payload: body.data,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit review";
    if (message.includes("already reviewed")) {
      return jsonError(message, 409);
    }
    return handleRouteError(error, "POST /api/products/[slug]/reviews");
  }
}

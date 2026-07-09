import { NextResponse } from "next/server";
import { getProductDetailBySlug } from "@/services/catalogService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  createProductQuestion,
  listApprovedQuestionsForProduct,
} from "@/lib/server/productQuestionRepository";
import { createProductQuestionSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const result = await listApprovedQuestionsForProduct(product.id);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/products/[slug]/questions");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimited = await enforceRateLimit(request, "product-question", {
      limit: 10,
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

    const body = await parseJsonBody(request, createProductQuestionSchema);
    if ("error" in body) return body.error;

    const question = await createProductQuestion({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      userId: sessionUser.uid,
      author: sessionUser.name ?? sessionUser.email ?? "Customer",
      question: body.data.question,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/products/[slug]/questions");
  }
}

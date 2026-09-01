import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { handleRouteError } from "@/lib/api/route-utils";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const rl = await enforceRateLimit(request, "product-detail", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { slug } = await context.params;
    const data = await loadProductDetailPage(slug);

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return handleRouteError(error, "api/products/[slug]", request);
  }
}

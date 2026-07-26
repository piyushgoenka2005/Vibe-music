import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/route-utils";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
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

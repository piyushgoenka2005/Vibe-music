import { NextResponse } from "next/server";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
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
    const message =
      error instanceof Error ? error.message : "Unable to load product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

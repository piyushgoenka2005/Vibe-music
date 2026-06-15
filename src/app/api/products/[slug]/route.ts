import { NextResponse } from "next/server";
import { resolveBundleBySlug } from "@/lib/server/bundleService";
import {
  getProductDetailBySlug,
  getProductSummaries,
  getRelatedProducts,
} from "@/services/catalogService";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getProductDetailBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const bundle = await resolveBundleBySlug(slug);

    return NextResponse.json(
      {
        product,
        bundle,
        frequentlyBoughtTogether: bundle?.items ?? [],
        similarProducts: await getProductSummaries(product.similarProductIds),
        relatedProducts: await getRelatedProducts(slug),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

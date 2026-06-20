import { NextResponse } from "next/server";
import { logFirestoreWarning } from "@/lib/server/firestoreErrors";
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

    let bundle = null;
    try {
      bundle = await resolveBundleBySlug(slug);
    } catch (error) {
      logFirestoreWarning("products", error, `Bundle lookup failed for ${slug}`);
    }

    let similarProducts = await getProductSummaries(product.similarProductIds);
    let relatedProducts: Awaited<ReturnType<typeof getRelatedProducts>> = [];

    try {
      relatedProducts = await getRelatedProducts(slug);
    } catch (error) {
      logFirestoreWarning(
        "products",
        error,
        `Related products lookup failed for ${slug}`
      );
      similarProducts = await getProductSummaries(product.similarProductIds);
    }

    return NextResponse.json(
      {
        product,
        bundle,
        frequentlyBoughtTogether: bundle?.items ?? [],
        similarProducts,
        relatedProducts,
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

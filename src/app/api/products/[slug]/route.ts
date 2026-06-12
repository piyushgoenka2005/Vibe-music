import { NextResponse } from "next/server";
import {
  getProductDetailBySlug,
  getProductSummaries,
  getRelatedProducts,
} from "@/services/catalogService";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = getProductDetailBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product,
      frequentlyBoughtTogether: getProductSummaries(
        product.frequentlyBoughtTogether
      ),
      similarProducts: getProductSummaries(product.similarProductIds),
      relatedProducts: getRelatedProducts(slug),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

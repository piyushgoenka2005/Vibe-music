import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/server/productRepository";
import type { SearchBrand, SearchCategory } from "@/types/search";

function buildCategoryFacets(
  products: Awaited<ReturnType<typeof searchProducts>>
): SearchCategory[] {
  const map = new Map<string, SearchCategory>();

  products.forEach((product) => {
    if (!map.has(product.categorySlug)) {
      map.set(product.categorySlug, {
        id: product.categorySlug,
        name: product.category,
        slug: product.categorySlug,
      });
    }
  });

  return Array.from(map.values());
}

function buildBrandFacets(
  products: Awaited<ReturnType<typeof searchProducts>>
): SearchBrand[] {
  const map = new Map<string, SearchBrand>();

  products.forEach((product) => {
    if (!map.has(product.brandSlug)) {
      map.set(product.brandSlug, {
        id: product.brandSlug,
        name: product.brand,
        slug: product.brandSlug,
      });
    }
  });

  return Array.from(map.values());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const mode = searchParams.get("mode") ?? "results";

    const products = await searchProducts({ query, category, brand, sort });
    const categories = buildCategoryFacets(products);
    const brands = buildBrandFacets(products);

    if (mode === "suggest") {
      return NextResponse.json({
        products: products.slice(0, 6).map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
        })),
        categories: categories.slice(0, 4),
        brands: brands.slice(0, 4),
      });
    }

    return NextResponse.json({
      query,
      products,
      categories,
      brands,
      total: products.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to perform search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

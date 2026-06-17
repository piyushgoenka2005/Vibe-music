import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/server/productRepository";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import type { SearchBrand, SearchCategory } from "@/types/search";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;

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

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "search", RATE_LIMITS.search);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const mode = searchParams.get("mode") ?? "results";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    );

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
          image: product.image,
        })),
        categories: categories.slice(0, 4),
        brands: brands.slice(0, 4),
      });
    }

    const total = products.length;
    const offset = (page - 1) * limit;
    const paginated = products.slice(offset, offset + limit);

    return NextResponse.json({
      query,
      products: paginated,
      categories,
      brands,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + limit < total,
    });
  } catch (error) {
    return handleRouteError(error, "api/search");
  }
}

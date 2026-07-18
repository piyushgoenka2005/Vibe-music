import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  buildBrandFacets,
  buildCategoryFacets,
  SEARCH_MIN_QUERY_LENGTH as MIN_QUERY_LENGTH,
} from "@/lib/server/searchResultsService";
import { searchProducts } from "@/lib/server/productRepository";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;

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
    const subcategory = searchParams.get("subcategory") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const mode = searchParams.get("mode") ?? "results";
    const returnAll = searchParams.get("all") === "1";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const hasFilter = Boolean(
      category?.trim() || subcategory?.trim() || brand?.trim()
    );
    if (query.length < MIN_QUERY_LENGTH && !hasFilter) {
      return NextResponse.json({
        query,
        products: [],
        categories: [],
        brands: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 1,
        hasMore: false,
      });
    }

    // Listing page applies brand/sort client-side; only narrow by category here.
    const apiBrand = returnAll ? undefined : brand;
    const apiSort = returnAll ? undefined : sort;
    const products = await searchProducts({
      query,
      category,
      subcategory,
      brand: apiBrand,
      sort: apiSort,
    });
    const categories = buildCategoryFacets(products);
    const brands = buildBrandFacets(products);

    if (mode === "suggest") {
      return NextResponse.json(
        {
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
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    const total = products.length;

    if (returnAll) {
      return NextResponse.json(
        {
          query,
          products,
          categories,
          brands,
          total,
          page: 1,
          limit: total,
          totalPages: 1,
          hasMore: false,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    const offset = (page - 1) * limit;
    const paginated = products.slice(offset, offset + limit);

    return NextResponse.json(
      {
        query,
        products: paginated,
        categories,
        brands,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: offset + limit < total,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/search");
  }
}

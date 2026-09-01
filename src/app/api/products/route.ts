import { NextResponse } from "next/server";
import {
  getTrendingProducts,
  searchProducts,
} from "@/lib/server/productRepository";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { getCached } from "@/lib/server/redisCache";

const PRODUCTS_CACHE_TTL = 45; // seconds — matches existing s-maxage

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "products",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const trending = searchParams.get("trending") === "true";

    if (trending) {
      const limitParam = searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : undefined;
      let products = await getTrendingProducts();
      if (Number.isFinite(limit) && limit && limit > 0) {
        products = products.slice(0, limit);
      }
      return NextResponse.json(
        { products },
        {
          headers: {
            "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
          },
        }
      );
    }

    const query = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const conditionParam = searchParams.get("condition") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const conditionValues = conditionParam
      ? conditionParam
          .split(",")
          .map((value) => value.trim())
          .filter(
            (value): value is "new" | "used" | "open-box" =>
              value === "new" || value === "used" || value === "open-box"
          )
      : [];

    // Build a stable cache key from the query params
    const cacheKey = [
      "products",
      query ?? "",
      category ?? "",
      brand ?? "",
      sort ?? "",
      conditionValues.join(","),
      String(limit ?? ""),
    ].join(":");

    const products = await getCached(
      cacheKey,
      () =>
        searchProducts({
          query,
          category,
          brand,
          sort,
          condition:
            conditionValues.length === 1 ? conditionValues[0] : undefined,
          conditions:
            conditionValues.length > 1 ? conditionValues : undefined,
          limit: Number.isFinite(limit) ? limit : undefined,
          // Category browse must include Coming Soon SKUs (₹0) so departments
          // like Microphones aren't empty when prices aren't set yet.
          purchasableOnly: category ? false : undefined,
        }),
      PRODUCTS_CACHE_TTL
    );

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/products");
  }
}

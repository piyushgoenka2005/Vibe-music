import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/server/productRepository";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "products",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const condition = searchParams.get("condition") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const products = await searchProducts({
      query,
      category,
      brand,
      sort,
      condition: condition as "new" | "used" | "open-box" | undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

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

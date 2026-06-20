import { NextResponse } from "next/server";
import { getCategories } from "@/services/catalogService";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "catalog-categories",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    return NextResponse.json(
      { categories: await getCategories() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    return handleRouteError(error, "api/catalog/categories");
  }
}

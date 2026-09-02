import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { listPublicBlogPostsPaginated } from "@/lib/server/blogService";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "blog-posts", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "9");
    const category = searchParams.get("category") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const featured = searchParams.get("featured") === "true";

    const result = await listPublicBlogPostsPaginated({
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 9,
      category: category || undefined,
      q: q || undefined,
      featured: featured || undefined,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return publicApiError(error, "Failed to load blog posts");
  }
}

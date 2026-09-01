import { NextResponse } from "next/server";
import { listPublicBlogPostsPaginated } from "@/lib/server/blogService";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request) {
  try {
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

    return NextResponse.json(result);
  } catch (error) {
    return publicApiError(error, "Failed to load blog posts");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getTaxonomies,
  getTaxonomyStats,
  getTaxonomyFilterOptions,
} from "@/lib/server/taxonomyRepository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("categories:read", request);

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 25;
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const subcategory = searchParams.get("subcategory") || undefined;
    const includeStats = searchParams.get("stats") === "true";
    const includeFilters = searchParams.get("filters") === "true";

    const [data, stats, filterOptions] = await Promise.all([
      getTaxonomies({ page, limit, search, category, subcategory }),
      includeStats ? getTaxonomyStats() : undefined,
      includeFilters ? getTaxonomyFilterOptions() : undefined,
    ]);

    return NextResponse.json({
      items: data.items,
      pagination: data.pagination,
      ...(stats && { stats }),
      ...(filterOptions && { filterOptions }),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

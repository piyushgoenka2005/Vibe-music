import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getTaxonomies,
  getTaxonomyStats,
  getTaxonomyFilterOptions,
  createTaxonomyNode,
  deleteTaxonomyNodes,
  deleteAllTaxonomyNodes,
} from "@/lib/server/taxonomyRepository";
import { taxonomyApiErrorResponse } from "@/lib/server/taxonomyApiErrors";
import { z } from "zod";

const createTaxonomySchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().min(1),
  variant: z.string().nullable().optional(),
  productType: z.string().min(1),
  instrumentFamily: z.string().nullable().optional(),
  seoSlug: z.string().min(1),
  googleProductCategory: z.string().nullable().optional(),
  menuLevel1: z.string().nullable().optional(),
  menuLevel2: z.string().nullable().optional(),
  menuLevel3: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

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
    return taxonomyApiErrorResponse(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("categories:write", request);
    const body = await request.json();
    const parsed = createTaxonomySchema.parse(body);
    const node = await createTaxonomyNode(parsed);
    return NextResponse.json({ item: node }, { status: 201 });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin("categories:delete", request);
    const body = await request.json().catch(() => ({}));
    if (body.all) {
      const deleted = await deleteAllTaxonomyNodes({
        category: body.category,
        search: body.search,
      });
      return NextResponse.json({ ok: true, deleted });
    }
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const deleted = await deleteTaxonomyNodes(body.ids);
      return NextResponse.json({ ok: true, deleted });
    }
    return NextResponse.json({ error: "Provide ids array or all: true" }, { status: 400 });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}

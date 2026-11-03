import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getTaxonomyNodeById,
  updateTaxonomyNode,
  deleteTaxonomyNode,
} from "@/lib/server/taxonomy/taxonomyRepository";
import { taxonomyApiErrorResponse } from "@/lib/server/taxonomyApiErrors";
import { z } from "zod";

const updateTaxonomySchema = z.object({
  category: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
  variant: z.string().nullable().optional(),
  productType: z.string().min(1).optional(),
  instrumentFamily: z.string().nullable().optional(),
  seoSlug: z.string().min(1).optional(),
  googleProductCategory: z.string().nullable().optional(),
  menuLevel1: z.string().nullable().optional(),
  menuLevel2: z.string().nullable().optional(),
  menuLevel3: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("categories:read", request);
    const { id } = await context.params;
    const node = await getTaxonomyNodeById(id);
    if (!node) {
      return NextResponse.json({ error: "Taxonomy node not found" }, { status: 404 });
    }
    return NextResponse.json({ item: node });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("categories:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTaxonomySchema.parse(body);
    const node = await updateTaxonomyNode(id, parsed);
    return NextResponse.json({ item: node });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin("categories:delete", request);
    const { id } = await context.params;
    await deleteTaxonomyNode(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return taxonomyApiErrorResponse(error, request);
  }
}

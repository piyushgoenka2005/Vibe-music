import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteProductRelatedList,
  getRelatedListByProductId,
  upsertProductRelatedList,
} from "@/lib/server/relatedProductsService";
import { adminProductRelatedSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:read");
    const { id } = await context.params;
    const related = await getRelatedListByProductId(id);
    return NextResponse.json({ related });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminProductRelatedSchema.parse(body);
    const related = await upsertProductRelatedList(id, parsed);
    return NextResponse.json({ related });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write");
    const { id } = await context.params;
    await deleteProductRelatedList(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

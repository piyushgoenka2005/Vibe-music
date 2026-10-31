import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/lib/server/catalog/categoryRepository";
import { adminCategorySchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:read", request);
    const { id } = await context.params;
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminCategorySchema.partial().parse(body);
    const category = await updateCategory(id, parsed);
    return NextResponse.json({ category });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:delete", request);
    const { id } = await context.params;
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

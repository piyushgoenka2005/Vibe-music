import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCategories, createCategory } from "@/lib/server/catalog/categoryRepository";
import { adminCategorySchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin("categories:read", request);
    console.debug("[admin/categories] User", admin.uid, "fetching categories");
    const categories = await listCategories();
    console.debug(
      "[admin/categories] Returning",
      categories.length,
      "categories to user",
      admin.uid,
    );
    return NextResponse.json({ categories });
  } catch (error) {
    console.error(
      "[admin/categories] GET failed:",
      error instanceof Error ? error.message : String(error),
    );
    return adminErrorResponse(error, request);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("categories:write", request);
    const body = await request.json();
    const parsed = adminCategorySchema.parse(body);
    const category = await createCategory({
      ...parsed,
      slug: parsed.slug ?? parsed.name.toLowerCase().replace(/\s+/g, "-"),
      parentId: parsed.parentId ?? null,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

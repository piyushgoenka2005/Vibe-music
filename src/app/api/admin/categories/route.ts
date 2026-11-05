import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCategories, createCategory } from "@/lib/server/catalog/categoryRepository";
import { adminCategorySchema } from "@/lib/validations/admin";
import { logInfo, logError } from "@/lib/server/logger";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin("categories:read", request);
    logInfo("Categories fetch initiated", "api/admin/categories", { userId: admin.uid });

    const categories = await listCategories();

    logInfo("Categories retrieved successfully", "api/admin/categories", {
      userId: admin.uid,
      count: categories.length,
    });
    return NextResponse.json({ categories });
  } catch (error) {
    logError("Failed to fetch categories", error, "api/admin/categories");
    return adminErrorResponse(error, request);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("categories:write", request);
    const body = await request.json();
    const parsed = adminCategorySchema.parse(body);

    logInfo("Creating category", "api/admin/categories", {
      userId: admin.uid,
      name: parsed.name,
    });

    const category = await createCategory({
      ...parsed,
      slug: parsed.slug ?? parsed.name.toLowerCase().replace(/\s+/g, "-"),
      parentId: parsed.parentId ?? null,
    });

    logInfo("Category created successfully", "api/admin/categories", {
      userId: admin.uid,
      categoryId: category.id,
      name: category.name,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    logError("Failed to create category", error, "api/admin/categories");
    return adminErrorResponse(error, request);
  }
}

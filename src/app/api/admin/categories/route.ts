import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listCategories,
  createCategory,
} from "@/lib/server/categoryRepository";
import { adminCategorySchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("categories:read");
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("categories:write");
    const body = await request.json();
    const parsed = adminCategorySchema.parse(body);
    const category = await createCategory({
      ...parsed,
      slug: parsed.slug ?? parsed.name.toLowerCase().replace(/\s+/g, "-"),
      parentId: parsed.parentId ?? null,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { seedCategoriesFromStatic } from "@/lib/server/catalog/categoryRepository";

export async function POST(request: Request) {
  try {
    await requireAdmin("categories:write", request);
    const categories = await seedCategoriesFromStatic();
    return NextResponse.json({ ok: true, count: categories.length, categories });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

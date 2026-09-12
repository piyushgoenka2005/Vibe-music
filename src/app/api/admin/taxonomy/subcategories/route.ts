import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getSubcategoriesByCategory } from "@/lib/server/taxonomyRepository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("categories:read", request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const subcategories = await getSubcategoriesByCategory(category);

    return NextResponse.json({ subcategories });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

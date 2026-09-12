import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { syncCategoriesFromTaxonomy } from "@/lib/server/taxonomyRepository";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("categories:write", request);

    const result = await syncCategoriesFromTaxonomy();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

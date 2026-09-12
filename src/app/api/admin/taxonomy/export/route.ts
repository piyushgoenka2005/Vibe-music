import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { exportTaxonomyCsv } from "@/lib/server/taxonomyRepository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("categories:read", request);

    const csvContent = await exportTaxonomyCsv();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Vibe_Music_Taxonomy_Export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

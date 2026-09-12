import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { parseTaxonomyBuffer, bulkImportTaxonomies } from "@/lib/server/taxonomyRepository";

export const maxDuration = 60; // Allow sufficient time for 40k row parsing and bulk db insert

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("categories:write", request);

    const formData = await request.formData();
    const file = formData.get("file");
    const replace = formData.get("replace") === "true";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an Excel (.xlsx/.xls) or CSV file." },
        { status: 400 },
      );
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls") && !filename.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a .xlsx, .xls, or .csv spreadsheet." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }

    // Parse and deduplicate rows
    const { rows, totalRowsRead, duplicatesSkipped } = parseTaxonomyBuffer(buffer);

    // Bulk insert into database
    const result = await bulkImportTaxonomies(rows, totalRowsRead, duplicatesSkipped, replace);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

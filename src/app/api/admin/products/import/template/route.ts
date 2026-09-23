import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
} from "@/lib/admin/bulkImportTemplate";

function attachmentFilename(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request) {
  try {
    await requireAdmin("products:read", request);
    const format = new URL(request.url).searchParams.get("format")?.trim().toLowerCase();

    if (format === "csv") {
      return new NextResponse(buildVibemusicBulkTemplateCsv(), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": attachmentFilename(VIBEMUSIC_BULK_TEMPLATE_CSV_FILE),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (format === "xlsx") {
      const buffer = buildVibemusicBulkTemplateXlsx();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": attachmentFilename(VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json(
      { error: "Use ?format=csv or ?format=xlsx to download the bulk import template." },
      { status: 400 },
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

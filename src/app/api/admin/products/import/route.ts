import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { csvRowToImportRow, parseCsv } from "@/lib/csv";
import {
  bulkImportProducts,
  previewBulkImport,
} from "@/services/catalogService";
import type { BulkImportRow } from "@/types/catalog";

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write");
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const confirm = formData.get("confirm") === "true";

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
      }

      const text = await file.text();
      const parsed = parseCsv(text);
      const rows: BulkImportRow[] = parsed.map(csvRowToImportRow);

      if (!confirm) {
        const preview = previewBulkImport(rows);
        return NextResponse.json({
          preview,
          summary: {
            total: preview.length,
            valid: preview.filter((r) => r.valid).length,
            invalid: preview.filter((r) => !r.valid).length,
          },
        });
      }

      const result = bulkImportProducts(rows);
      return NextResponse.json({ result });
    }

    const body = await request.json();
    if (body.action === "confirm" && Array.isArray(body.rows)) {
      const result = bulkImportProducts(body.rows as BulkImportRow[]);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Invalid import request" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

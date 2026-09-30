import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  MAX_IMPORT_ROWS,
  MAX_SHEET_BYTES,
  parseBulkImportOptions,
  validateZipFile,
} from "@/lib/admin/bulkImportValidation";
import {
  createEmptyBulkImportZipImageIndex,
  readBulkImportZipImageIndex,
} from "@/lib/admin/bulkImportZipImages";
import { slimBulkImportPreviewRows } from "@/lib/admin/bulkImportResponse";
import {
  isSpreadsheetUpload,
  parseProductImportBuffer,
  validateVibemusicBulkHeaders,
  VIBEMUSIC_BULK_CORE_COLUMN_COUNT,
  VIBEMUSIC_BULK_COLUMN_COUNT,
} from "@/lib/amazonListingImport";
import { resolveBulkImportImages } from "@/lib/server/bulkImportImageResolver";
import {
  buildBulkImportPreviewSummary,
  bulkImportProducts,
  enrichBulkImportRowSkus,
  enrichBulkImportRowSlugs,
  previewBulkImport,
} from "@/services/catalogService";

/** Large catalog uploads (up to 2,000 rows) may include image ZIP processing. */
export const maxDuration = 300;

const MAX_SHEET_MB = Math.round(MAX_SHEET_BYTES / (1024 * 1024));

const importFlagsSchema = z.object({
  confirm: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("products:write", request);
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Multipart form required" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const zipFile = formData.get("zip");
    const importOptions = parseBulkImportOptions(formData.get("options"));
    const flags = importFlagsSchema.safeParse({
      confirm: formData.get("confirm") === "true",
    });
    if (!flags.success) {
      return NextResponse.json({ error: "Invalid import flags" }, { status: 400 });
    }
    const confirm = flags.data.confirm;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Vibe Music bulk template (.xlsx or .csv) is required" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_SHEET_BYTES) {
      return NextResponse.json(
        {
          error: `Listing file must be between 1 byte and ${MAX_SHEET_MB} MB`,
        },
        { status: 400 },
      );
    }

    if (!isSpreadsheetUpload(file.name, file.type)) {
      return NextResponse.json(
        { error: "Upload the vibemusic bulk template as .xlsx or .csv" },
        { status: 400 },
      );
    }

    if (zipFile instanceof File && zipFile.size > 0) {
      const zipValidationError = validateZipFile(zipFile);
      if (zipValidationError) {
        return NextResponse.json({ error: zipValidationError }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsed;
    try {
      parsed = parseProductImportBuffer(buffer, file.name);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to parse listing file" },
        { status: 400 },
      );
    }

    if (parsed.format === "vibemusic-bulk") {
      const headerError = validateVibemusicBulkHeaders(parsed.headers);
      if (headerError) {
        return NextResponse.json({ error: headerError }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        {
          error: `Upload must use vibemusic bulk.csv or vibemusic bulk.xlsx with ${VIBEMUSIC_BULK_CORE_COLUMN_COUNT} core columns (or ${VIBEMUSIC_BULK_COLUMN_COUNT} including image1–image12) in the official template order. Download the template from the Import dialog.`,
        },
        { status: 400 },
      );
    }

    if (parsed.rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `Listing exceeds ${MAX_IMPORT_ROWS} product rows` },
        { status: 400 },
      );
    }

    let rows = parsed.rows;

    const zipIndex = createEmptyBulkImportZipImageIndex();
    if (zipFile instanceof File && zipFile.size > 0) {
      try {
        Object.assign(
          zipIndex,
          readBulkImportZipImageIndex(Buffer.from(await zipFile.arrayBuffer())),
        );
      } catch {
        return NextResponse.json(
          { error: "Could not read the images ZIP. Upload a valid .zip archive." },
          { status: 400 },
        );
      }
    }

    rows = await enrichBulkImportRowSlugs(rows);
    rows = await enrichBulkImportRowSkus(rows);
    try {
      rows = await resolveBulkImportImages(rows, zipIndex, confirm);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to process import images. Check the ZIP and try again.",
        },
        { status: 400 },
      );
    }

    if (!confirm) {
      const preview = await previewBulkImport(rows, importOptions);
      const summary = buildBulkImportPreviewSummary(preview, parsed.emptyRowsSkipped);
      return NextResponse.json({
        preview: slimBulkImportPreviewRows(preview),
        format: parsed.format,
        options: importOptions,
        summary,
      });
    }

    const result = await bulkImportProducts(rows, {
      ...importOptions,
      adminId: admin.uid,
    });
    return NextResponse.json({ result, format: parsed.format, options: importOptions });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  MAX_IMPORT_ROWS,
  MAX_SHEET_BYTES,
  parseBulkImportOptions,
  validateZipFile,
} from "@/lib/admin/bulkImportValidation";
import { slimBulkImportPreviewRows } from "@/lib/admin/bulkImportResponse";
import {
  isSpreadsheetUpload,
  parseProductImportBuffer,
  validateAmazonListingHeaders,
} from "@/lib/amazonListingImport";
import { resolveBulkImportImages } from "@/lib/server/bulkImportImageResolver";
import {
  buildBulkImportPreviewSummary,
  bulkImportProducts,
  previewBulkImport,
} from "@/services/catalogService";

/** Large catalog uploads (up to 2,000 rows) may include image ZIP processing. */
export const maxDuration = 300;

const MAX_SHEET_MB = Math.round(MAX_SHEET_BYTES / (1024 * 1024));

const importFlagsSchema = z.object({
  confirm: z.boolean(),
});

function readZipImageMap(zipBuffer: Buffer): Map<string, Buffer> {
  const zipMap = new Map<string, Buffer>();
  const zip = new AdmZip(zipBuffer);
  zip.getEntries().forEach((entry) => {
    if (!entry.isDirectory && /\.(jpe?g|png|webp|gif)$/i.test(entry.entryName)) {
      const name = entry.entryName.split("/").pop() ?? entry.entryName;
      zipMap.set(name.toLowerCase(), entry.getData());
    }
  });
  return zipMap;
}

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
      const headerError = validateAmazonListingHeaders(parsed.headers);
      if (headerError) {
        return NextResponse.json({ error: headerError }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Upload must use vibemusic bulk.csv or vibemusic bulk.xlsx with all 69 columns in the exact template order. Download the template from the Import dialog.",
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

    const zipMap = new Map<string, Buffer>();
    if (zipFile instanceof File && zipFile.size > 0) {
      try {
        const extracted = readZipImageMap(Buffer.from(await zipFile.arrayBuffer()));
        extracted.forEach((value, key) => zipMap.set(key, value));
      } catch {
        return NextResponse.json(
          { error: "Could not read the images ZIP. Upload a valid .zip archive." },
          { status: 400 },
        );
      }
    }

    rows = await resolveBulkImportImages(rows, zipMap, confirm);

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

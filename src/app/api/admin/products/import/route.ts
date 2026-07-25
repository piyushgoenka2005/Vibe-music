import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { z } from "zod";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { csvRowToImportRow, parseCsv } from "@/lib/csv";
import { productUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import {
  bulkImportProducts,
  previewBulkImport,
} from "@/services/catalogService";
import type { BulkImportRow } from "@/types/catalog";

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_IMPORT_ROWS = 2000;

const importFlagsSchema = z.object({
  confirm: z.boolean(),
});

function collectImageNames(row: BulkImportRow): string[] {
  return [row.image1, row.image2, row.image3, row.image4, row.image5].filter(
    (name): name is string => Boolean(name?.trim())
  );
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Multipart form required" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const zipFile = formData.get("zip");
    const flags = importFlagsSchema.safeParse({
      confirm: formData.get("confirm") === "true",
    });
    if (!flags.success) {
      return NextResponse.json({ error: "Invalid import flags" }, { status: 400 });
    }
    const confirm = flags.data.confirm;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_CSV_BYTES) {
      return NextResponse.json(
        { error: `CSV must be between 1 byte and ${MAX_CSV_BYTES} bytes` },
        { status: 400 }
      );
    }

    if (
      file.name &&
      !file.name.toLowerCase().endsWith(".csv") &&
      !file.type.includes("csv") &&
      !file.type.includes("text")
    ) {
      return NextResponse.json({ error: "Upload a .csv file" }, { status: 400 });
    }

    if (zipFile instanceof File && zipFile.size > MAX_ZIP_BYTES) {
      return NextResponse.json(
        { error: `ZIP must be at most ${MAX_ZIP_BYTES} bytes` },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `CSV exceeds ${MAX_IMPORT_ROWS} rows` },
        { status: 400 }
      );
    }
    let rows: BulkImportRow[] = parsed.map(csvRowToImportRow);

    const zipMap = new Map<string, Buffer>();
    if (zipFile instanceof File && zipFile.size > 0) {
      const zip = new AdmZip(Buffer.from(await zipFile.arrayBuffer()));
      zip.getEntries().forEach((entry) => {
        if (!entry.isDirectory && /\.(jpe?g|png|webp|gif)$/i.test(entry.entryName)) {
          const name = entry.entryName.split("/").pop() ?? entry.entryName;
          zipMap.set(name.toLowerCase(), entry.getData());
        }
      });
    }

    rows = await Promise.all(
      rows.map(async (row) => {
        const imageNames = collectImageNames(row);
        const resolvedImages: string[] = [];

        for (const ref of imageNames) {
          if (isUrl(ref)) {
            resolvedImages.push(ref);
            continue;
          }
          const buffer = zipMap.get(ref.toLowerCase());
          if (buffer) {
            const categorySlug = row.category.toLowerCase().replace(/\s+/g, "-");
            const productSlug = row.name.toLowerCase().replace(/\s+/g, "-");
            const uploaded = await uploadOptimizedImageToCdn(buffer, {
              folder: productUploadFolder(categorySlug, productSlug),
              filenameHint: ref,
            });
            resolvedImages.push(uploaded.url);
          }
        }

        return { ...row, resolvedImages };
      })
    );

    if (!confirm) {
      const preview = await previewBulkImport(rows);
      return NextResponse.json({
        preview,
        summary: {
          total: preview.length,
          valid: preview.filter((r) => r.valid).length,
          invalid: preview.filter((r) => !r.valid).length,
        },
      });
    }

    const result = await bulkImportProducts(rows);
    return NextResponse.json({ result });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

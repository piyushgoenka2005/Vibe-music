import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { productUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import {
  adminProductUploadMetaSchema,
  adminImageMimeTypeSchema,
} from "@/lib/validations/admin";

const MAX_UPLOAD_FILES = 20;

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const formData = await request.formData();
    const meta = adminProductUploadMetaSchema.parse({
      categorySlug: String(formData.get("categorySlug") ?? "general"),
      productSlug: String(formData.get("productSlug") ?? "").trim() || undefined,
    });
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }
    if (files.length > MAX_UPLOAD_FILES) {
      return NextResponse.json({ error: "Too many images" }, { status: 400 });
    }

    for (const file of files) {
      adminImageMimeTypeSchema.parse({ mimeType: file.type });
    }

    const folder = productUploadFolder(meta.categorySlug, meta.productSlug);
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return uploadOptimizedImageToCdn(buffer, {
          folder,
          filenameHint: file.name,
        });
      })
    );

    const urls = uploadResults.map((r) => r.url);
    const masters = uploadResults.map((r) => r.masterUrl);

    return NextResponse.json({ urls, masters });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

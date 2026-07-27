import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { bannerUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import { adminImageMimeTypeSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin("banners:write", request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    adminImageMimeTypeSchema.parse({ mimeType: file.type });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadOptimizedImageToCdn(buffer, {
      folder: bannerUploadFolder(),
      filenameHint: file.name,
    });

    return NextResponse.json({
      url: uploaded.url,
      masterUrl: uploaded.masterUrl,
      derivatives: uploaded.derivatives,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

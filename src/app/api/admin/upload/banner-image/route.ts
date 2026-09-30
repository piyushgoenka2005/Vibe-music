import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { bannerUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import {
  ADMIN_IMAGE_MAX_BYTES,
  readAndValidateImageFile,
} from "@/lib/security/imageUploadValidation";

export async function POST(request: Request) {
  try {
    await requireAdmin("banners:write", request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validated = await readAndValidateImageFile(file, ADMIN_IMAGE_MAX_BYTES);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const uploaded = await uploadOptimizedImageToCdn(validated.buffer, {
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

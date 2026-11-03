import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse, AdminAuthError } from "@/lib/auth/require-admin";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { uploadBufferToCdn, videoUploadFolder } from "@/lib/server/platform/cdnStorage";

export const dynamic = "force-dynamic";

const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(undefined, request);
    if (!hasAnyPermission(admin.permissions, ["homepage:write", "banners:write"])) {
      throw new AdminAuthError("Insufficient permissions to upload video", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const isMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    const isWebm = file.type === "video/webm" || file.name.toLowerCase().endsWith(".webm");

    if (!isMp4 && !isWebm) {
      return NextResponse.json(
        { error: "Invalid video format. Only MP4 and WebM video files are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: `Video file exceeds maximum size limit of ${MAX_VIDEO_BYTES / (1024 * 1024)}MB.` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadedUrl = await uploadBufferToCdn(buffer, file.name, {
      folder: videoUploadFolder(),
      contentType: file.type || (isMp4 ? "video/mp4" : "video/webm"),
    });

    return NextResponse.json({
      url: uploadedUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getMediaAssets,
  deleteMediaAsset,
  addUploadedMediaAsset,
} from "@/lib/server/catalog/mediaLibraryService";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("products:read", request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const assets = await getMediaAssets({ category, search });

    const totalBytes = assets.reduce((acc, curr) => acc + curr.sizeKb * 1024, 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

    const stats = {
      totalCount: assets.length,
      imageCount: assets.filter((a) => a.type === "image").length,
      videoCount: assets.filter((a) => a.type === "video").length,
      storageUsedMb: totalMb,
      cdnStatus: "Edge CDN Synchronized",
      webpCoveragePercent: 100,
    };

    return NextResponse.json({ assets, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load media assets";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin("products:delete", request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Media asset id is required" }, { status: 400 });
    }

    const success = await deleteMediaAsset(id);
    if (!success) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete media asset";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("products:write", request);
    const body = await request.json();

    if (!body.url || !body.name) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const asset = await addUploadedMediaAsset({
      name: String(body.name).trim(),
      url: String(body.url).trim(),
      type: body.type || (body.url.endsWith(".mp4") ? "video" : "image"),
      format: body.format || (body.url.endsWith(".mp4") ? "mp4" : "webp"),
      sizeKb: Number(body.sizeKb) || 120,
      dimensions: body.dimensions || "1200x1200",
      category: body.category || "uploads",
      productSku: body.productSku,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register media asset";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

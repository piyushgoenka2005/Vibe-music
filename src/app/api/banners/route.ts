import { NextResponse } from "next/server";
import { listActiveBanners } from "@/lib/server/bannerService";

export async function GET() {
  try {
    const banners = await listActiveBanners();
    return NextResponse.json(
      { banners },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load banners";
    const status = message.includes("Quota exceeded") ? 503 : 500;
    return NextResponse.json({ error: message, banners: [] }, { status });
  }
}

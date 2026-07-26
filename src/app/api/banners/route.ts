import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/route-utils";
import { listActiveBanners } from "@/lib/server/bannerService";

export async function GET(request: Request) {
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
    if (message.includes("Quota exceeded")) {
      return NextResponse.json({ error: "Service busy", banners: [] }, { status: 503 });
    }
    return handleRouteError(error, "api/banners", request);
  }
}

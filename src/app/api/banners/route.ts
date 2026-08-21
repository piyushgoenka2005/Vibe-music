import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/route-utils";
import { isPrismaUnavailableError } from "@/lib/db/prisma-errors";
import { listActiveBanners } from "@/lib/server/bannerService";

export async function GET(request: Request) {
  try {
    const banners = await listActiveBanners();
    return NextResponse.json(
      { banners },
      {
        headers: {
          // Public marketing content — safe to cache briefly at the browser,
          // shared caches, and origin. Admin edits propagate within minutes.
          "Cache-Control":
            "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      return NextResponse.json(
        { banners: [] },
        {
          headers: {
            "Cache-Control":
              "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
          },
        }
      );
    }
    const message =
      error instanceof Error ? error.message : "Unable to load banners";
    if (message.includes("Quota exceeded")) {
      return NextResponse.json({ error: "Service busy", banners: [] }, { status: 503 });
    }
    return handleRouteError(error, "api/banners", request);
  }
}

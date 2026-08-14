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
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      return NextResponse.json(
        { banners: [] },
        {
          headers: {
            "Cache-Control": "private, no-store, max-age=0",
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

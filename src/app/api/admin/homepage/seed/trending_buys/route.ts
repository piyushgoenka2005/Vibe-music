import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { seedDefaultTrendingBuys } from "@/lib/server/homepage/homepageService";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    let mode: "items" | "defaults" = "items";
    try {
      const body = (await request.json()) as { mode?: unknown };
      if (body?.mode === "defaults") {
        mode = "defaults";
      }
    } catch {
      // Optional JSON body — default to populating curated items from live trending catalog.
    }
    const items = await seedDefaultTrendingBuys(mode);
    return NextResponse.json({ ok: true, mode, count: items.length, items });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

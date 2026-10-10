import { NextResponse } from "next/server";
import { getStorefrontVersion } from "@/lib/server/storefront/storefrontCacheInvalidation";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { v: getStorefrontVersion() },
    { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } },
  );
}

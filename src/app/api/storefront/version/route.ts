import { NextResponse } from "next/server";
import { readStorefrontVersion } from "@/lib/server/storefront/storefrontCacheInvalidation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { v: await readStorefrontVersion() },
    { headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" } },
  );
}

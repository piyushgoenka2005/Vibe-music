import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/require-admin";
import { backfillProductSubcategories } from "@/services/catalogService";

/** POST ?dryRun=true previews; without it, empty subcategories are written. */
export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
    const result = await backfillProductSubcategories({ dryRun });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

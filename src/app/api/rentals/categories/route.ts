import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { listRentalCategories } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "rental-categories", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const categories = await listRentalCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load categories" },
      { status: 500 }
    );
  }
}

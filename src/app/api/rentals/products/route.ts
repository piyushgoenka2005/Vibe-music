import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { listRentalProducts } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
    const rl = await enforceRateLimit(request, "rental-products", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { searchParams } = new URL(request.url);
    const products = await listRentalProducts({
      categorySlug: searchParams.get("category") ?? undefined,
      featured: searchParams.get("featured") === "1",
      search: searchParams.get("q") ?? undefined,
    });
    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

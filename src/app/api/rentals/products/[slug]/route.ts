import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  getRentalProductBySlug,
  listRentalBlocksForProduct,
  listRentalLocksForProduct,
} from "@/lib/server/rentalRepository";
import { buildAvailabilityCalendar } from "@/lib/rental/availabilityEngine";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const rl = await enforceRateLimit(request, "rental-product-detail", RATE_LIMITS.publicApi);
    if (rl) return rl;

    const { slug } = await context.params;
    const product = await getRentalProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
      const [locks, blocks] = await Promise.all([
        listRentalLocksForProduct(product.id),
        listRentalBlocksForProduct(product.id),
      ]);
      const calendar = buildAvailabilityCalendar(
        { product, locks, blocks },
        from,
        to
      );
      return NextResponse.json({ product, calendar });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return publicApiError(error, "Failed to load product");
  }
}

import { NextResponse } from "next/server";
import {
  getRentalProductBySlug,
  listRentalBlocksForProduct,
  listRentalLocksForProduct,
} from "@/lib/server/rentalRepository";
import { buildAvailabilityCalendar } from "@/lib/rental/availabilityEngine";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load product" },
      { status: 500 }
    );
  }
}

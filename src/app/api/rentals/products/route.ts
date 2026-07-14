import { NextResponse } from "next/server";
import { listRentalProducts } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
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

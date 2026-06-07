import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/server/productRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const brand = searchParams.get("brand") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const condition = searchParams.get("condition") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const products = await searchProducts({
      query,
      category,
      brand,
      sort,
      condition: condition as "new" | "used" | "open-box" | undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({ products });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

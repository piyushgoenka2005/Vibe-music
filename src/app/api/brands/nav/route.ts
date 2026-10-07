import { NextResponse } from "next/server";
import { loadBrandsWithCounts } from "@/lib/server/brandsPageLoader";

/** Public brand list for header mega-menu (name + slug only). */
export async function GET() {
  try {
    const brands = await loadBrandsWithCounts();
    return NextResponse.json(
      {
        brands: brands.map((brand) => ({
          name: brand.name,
          slug: brand.slug,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("[api/brands/nav] Error:", error);
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
  }
}

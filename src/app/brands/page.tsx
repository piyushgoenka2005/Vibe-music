import { redirect } from "next/navigation";
import type { Metadata } from "next";
import BrandsPage from "@/components/brands/BrandsPage";
import { loadBrandDirectory, resolveBrandBySlug } from "@/lib/server/brandsPageLoader";
import { brandPath } from "@/lib/routes";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Brands | Vibe Music",
  description:
    "Browse every brand stocked at Vibe Music — search, jump A–Z, and shop each collection.",
};

interface BrandsDirectoryRouteProps {
  searchParams: Promise<{ brand?: string }>;
}

export default async function BrandsRoute({ searchParams }: BrandsDirectoryRouteProps) {
  const params = await searchParams;
  const brandSlug = params.brand?.split(",")[0]?.trim();
  if (brandSlug) {
    const brand = await resolveBrandBySlug(brandSlug);
    if (brand) {
      redirect(brandPath(brand.slug));
    }
  }

  return withServerPageError(async () => {
    const brands = await loadBrandDirectory();
    return <BrandsPage brands={brands} />;
  }, "Brands");
}

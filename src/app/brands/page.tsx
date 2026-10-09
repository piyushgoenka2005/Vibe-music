import { redirect } from "next/navigation";
import type { Metadata } from "next";
import BrandsPage from "@/components/brands/BrandsPage";
import { BRAND } from "@/lib/brand";
import { loadBrandDirectory, resolveBrandBySlug } from "@/lib/server/brandsPageLoader";
import { brandPath } from "@/lib/routes";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

const brandsIndexUrl = `${BRAND.siteUrl}/brands`;

export const metadata: Metadata = {
  title: "Brands | Vibe Music",
  description:
    "Browse every brand stocked at Vibe Music — search, jump A–Z, and shop each collection.",
  alternates: { canonical: brandsIndexUrl },
  openGraph: {
    title: "Brands | Vibe Music",
    description:
      "Browse every brand stocked at Vibe Music — search, jump A–Z, and shop each collection.",
    url: brandsIndexUrl,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${BRAND.siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${BRAND.name} brand directory`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brands | Vibe Music",
    description:
      "Browse every brand stocked at Vibe Music — search, jump A–Z, and shop each collection.",
  },
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

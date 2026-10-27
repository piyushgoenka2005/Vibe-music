import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BrandsPage from "@/components/brands/BrandsPage";
import { BRAND } from "@/lib/brand";
import { buildBrandMetadata } from "@/lib/seo/brandMetadata";
import { loadBrandDirectory, resolveBrandBySlug } from "@/lib/server/brandsPageLoader";
import { withServerPageError } from "@/lib/serverPageError";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const brands = await loadBrandDirectory();
    return brands.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

interface BrandRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BrandRouteProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const brand = await resolveBrandBySlug(slug);
    if (!brand) {
      return {
        title: `Brand not found | ${BRAND.name}`,
        robots: { index: false, follow: false },
      };
    }
    return buildBrandMetadata(brand);
  } catch (error) {
    console.error("[brand:generateMetadata] error generating brand metadata", error);
    return {
      title: `Brand | ${BRAND.name}`,
      robots: { index: false, follow: false },
    };
  }
}

export default async function BrandRoute({ params }: BrandRouteProps) {
  return withServerPageError(async () => {
    const { slug } = await params;
    const brands = await loadBrandDirectory();
    const brand = brands.find((b) => b.slug.toLowerCase() === slug.trim().toLowerCase());
    if (!brand) notFound();
    return <BrandsPage brands={brands} initialBrandSlug={brand.slug} />;
  }, "Brand");
}

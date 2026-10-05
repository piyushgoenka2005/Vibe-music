import { BRAND } from "@/lib/brand";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { brandPath } from "@/lib/routes";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";
import type { Metadata } from "next";

function absoluteAssetUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BRAND.siteUrl}${normalized}`;
}

export function resolveBrandOgImage(brand: BrandDirectoryGroup): string | undefined {
  const logo = brand.logoUrl ?? getBrandLogoUrl(brand.slug);
  if (logo) return absoluteAssetUrl(logo);
  const productImage = brand.products[0]?.image;
  if (productImage) return absoluteAssetUrl(productImage);
  return undefined;
}

export function buildBrandMetadata(brand: BrandDirectoryGroup): Metadata {
  const title = `${brand.name} | ${BRAND.name}`;
  const description = `Shop ${brand.productCount} ${brand.name} products at ${BRAND.name}. Authorized catalog, manufacturer warranty, and free delivery across India.`;
  const canonicalUrl = `${BRAND.siteUrl}${brandPath(brand.slug)}`;
  const ogImage = resolveBrandOgImage(brand);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `${brand.name} at ${BRAND.name}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

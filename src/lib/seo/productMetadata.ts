import { BRAND } from "@/lib/brand";
import { cdnSeoImageUrl } from "@/lib/storefrontImages";
import { productPath } from "@/lib/routes";
import type { ProductDetail } from "@/types/product";
import type { Metadata } from "next";

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildProductMetadata(product: ProductDetail): Metadata {
  const rawDescription = product.description ? stripHtml(product.description) : "";
  const metaDescription =
    product.metaDescription?.trim() ||
    (rawDescription.length > 20
      ? rawDescription.slice(0, 160)
      : `${product.name} by ${product.brand}. Buy online with manufacturer warranty and free shipping from ${BRAND.name}.`);
  const pageTitle = product.metaTitle?.trim() || `${product.name} | ${BRAND.name}`;

  const hero = product.images?.[0]?.src || product.image;
  const ogImage = hero ? cdnSeoImageUrl(hero) : undefined;
  const canonicalUrl = `${BRAND.siteUrl}${productPath(product.slug)}`;
  const availability = product.availability === "out-of-stock" ? "out of stock" : "in stock";

  return {
    title: pageTitle,
    description: metaDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.metaTitle?.trim() || product.name,
      description: metaDescription,
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
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.metaTitle?.trim() || product.name,
      description: metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    other: {
      "product:brand": product.brand,
      "product:availability": availability,
      "product:condition": product.condition,
      "product:price:amount": String(product.price),
      "product:price:currency": "INR",
      "product:retailer_item_id": product.id,
    },
  };
}

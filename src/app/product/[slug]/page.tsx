import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";
import { resolveCanonicalProductSlug } from "@/services/catalogService";
import { buildProductJsonLd } from "@/lib/seo/productJsonLd";
import { cdnSeoImageUrl, storefrontImageUrl } from "@/lib/storefrontImages";
import { BRAND } from "@/lib/brand";

export const dynamicParams = true;
export const revalidate = 300;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = (await resolveCanonicalProductSlug(slug)) ?? slug;
  const detail = await loadProductDetailPage(canonicalSlug);
  const product = detail?.product;
  if (!product) {
    return {
      title: `Product not found | ${BRAND.name}`,
      robots: { index: false, follow: false },
    };
  }

  const rawDescription = product.description
    ? product.description
        .replace(/<[^>]*>?/gm, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const metaDescription =
    rawDescription.length > 20
      ? rawDescription.slice(0, 160)
      : `${product.name} by ${product.brand}. Buy online with manufacturer warranty and free shipping from ${BRAND.name}.`;

  const hero = product.images?.[0]?.src || product.image;
  const ogImage = hero ? cdnSeoImageUrl(hero) : undefined;
  const canonicalUrl = `${BRAND.siteUrl}/product/${product.slug}`;

  return {
    title: `${product.name} | ${BRAND.name}`,
    description: metaDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.name,
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
      title: product.name,
      description: metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  const canonicalSlug = await resolveCanonicalProductSlug(slug);

  if (canonicalSlug && canonicalSlug !== slug) {
    redirect(`/product/${canonicalSlug}`);
  }

  let initialData;
  try {
    initialData = await loadProductDetailPage(canonicalSlug ?? slug);
  } catch {
    initialData = null;
  }

  if (!initialData?.product) {
    notFound();
  }

  const defaultVariant =
    initialData.product.variants.find((v) => v.availability !== "out-of-stock") ??
    initialData.product.variants[0];

  const heroRaw = initialData.product.images?.[0]?.src || initialData.product.image;
  const heroImageUrl = heroRaw ? storefrontImageUrl(heroRaw, 1200).src : undefined;

  const jsonLd = buildProductJsonLd(initialData.product, defaultVariant);

  return (
    <main className="storefront-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {heroImageUrl ? (
        <link rel="preload" as="image" href={heroImageUrl} fetchPriority="high" />
      ) : null}
      <ProductDetailPage slug={slug} initialData={initialData} />
    </main>
  );
}

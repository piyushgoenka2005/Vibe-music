import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";
import { buildProductJsonLd } from "@/lib/seo/productJsonLd";
import { cdnSeoImageUrl, storefrontImageUrl } from "@/lib/storefrontImages";

export const dynamicParams = true;
export const revalidate = 300;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await loadProductDetailPage(slug);
  const product = detail?.product;
  if (!product) {
    return { title: "Product not found | Vibe Music" };
  }

  const hero = product.images?.[0]?.src || product.image;
  // Social crawlers need absolute CDN URLs, not our resize proxy.
  const ogImage = hero ? cdnSeoImageUrl(hero) : undefined;

  return {
    title: `${product.name} | Vibe Music`,
    description: product.description?.slice(0, 160) ?? product.name,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.name,
      url: `/product/${slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description?.slice(0, 160) ?? product.name,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  let initialData;
  try {
    initialData = await loadProductDetailPage(slug);
  } catch {
    initialData = null;
  }

  if (!initialData?.product) {
    notFound();
  }

  const defaultVariant =
    initialData.product.variants.find((v) => v.availability !== "out-of-stock") ??
    initialData.product.variants[0];

  const heroRaw =
    initialData.product.images?.[0]?.src || initialData.product.image;
  const heroImageUrl = heroRaw
    ? storefrontImageUrl(heroRaw, 1200).src
    : undefined;

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

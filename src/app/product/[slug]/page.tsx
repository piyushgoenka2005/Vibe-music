import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ProductDeliveryEstimateServer from "@/components/product/ProductDeliveryEstimateServer";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductCorePage, loadProductDetailPage } from "@/lib/server/productDetailLoader";
import { resolveCanonicalProductSlug } from "@/services/catalogService";
import { buildProductJsonLd } from "@/lib/seo/productJsonLd";
import { buildProductMetadata } from "@/lib/seo/productMetadata";
import { resolveStoreShippingPolicy } from "@/lib/storefront/resolveStoreShippingPolicy";

export const dynamicParams = true;
export const revalidate = 300;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = (await resolveCanonicalProductSlug(slug)) ?? slug;
  const product = await loadProductCorePage(canonicalSlug);
  if (!product) {
    return {
      title: `Product not found | Vibe Music`,
      robots: { index: false, follow: false },
    };
  }

  return buildProductMetadata(product);
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

  const jsonLd = buildProductJsonLd(initialData.product, defaultVariant);
  const shippingPolicy = await resolveStoreShippingPolicy();

  return (
    <main className="storefront-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDeliveryEstimateServer />
      <ProductDetailPage
        slug={slug}
        initialData={initialData}
        shippingDetail={shippingPolicy.pdpDetail}
      />
    </main>
  );
}

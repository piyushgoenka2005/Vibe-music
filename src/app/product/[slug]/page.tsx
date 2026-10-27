import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import ProductDeliveryEstimateServer from "@/components/product/ProductDeliveryEstimateServer";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductCorePage, loadProductDetailPage } from "@/lib/server/productDetailLoader";
import { resolveCanonicalProductSlug } from "@/services/catalogService";
import { buildProductJsonLd } from "@/lib/seo/productJsonLd";
import { buildProductMetadata } from "@/lib/seo/productMetadata";
import { resolveStoreShippingPolicy } from "@/lib/storefront/resolveStoreShippingPolicy";

import { withServerPageError } from "@/lib/serverPageError";

export const dynamicParams = true;
export const revalidate = 300;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const canonicalSlug = (await resolveCanonicalProductSlug(slug)) ?? slug;
    const product = await loadProductCorePage(canonicalSlug);
    if (!product) {
      return {
        title: "Product not found | Vibe Music",
        robots: { index: false, follow: false },
      };
    }

    return buildProductMetadata(product);
  } catch (error) {
    console.error("[pdp:generateMetadata] error generating product metadata", error);
    return {
      title: "Product | Vibe Music",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  return withServerPageError(async () => {
    const { slug } = await params;
    let canonicalSlug: string | null = null;
    try {
      canonicalSlug = await resolveCanonicalProductSlug(slug);
    } catch {
      canonicalSlug = null;
    }

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

    const variants = Array.isArray(initialData.product.variants)
      ? initialData.product.variants
      : [];
    const defaultVariant = variants.find((v) => v.availability !== "out-of-stock") ?? variants[0];

    const jsonLd = buildProductJsonLd(initialData.product, defaultVariant);
    let shippingDetail = "Free delivery on all prepaid orders across India";
    try {
      const shippingPolicy = await resolveStoreShippingPolicy();
      shippingDetail = shippingPolicy.pdpDetail;
    } catch {
      /* fallback to default */
    }

    return (
      <main className="storefront-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProductDeliveryEstimateServer />
        <ProductDetailPage slug={slug} initialData={initialData} shippingDetail={shippingDetail} />
      </main>
    );
  }, "Product");
}

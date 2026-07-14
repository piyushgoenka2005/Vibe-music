import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductCorePage } from "@/lib/server/productDetailLoader";
import { storefrontImageUrl } from "@/lib/storefrontImages";
import type { ProductDetailResult } from "@/services/product.service";
import type { ProductDetail } from "@/types/product";

export const dynamicParams = true;
export const revalidate = 300;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

function toInitialData(product: ProductDetail): ProductDetailResult {
  return {
    product,
    bundle: null,
    frequentlyBoughtTogether: [],
    similarProducts: [],
    relatedProducts: [],
  };
}

export async function generateMetadata({
  params,
}: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProductCorePage(slug);
  if (!product) {
    return { title: "Product not found | Vibe Music" };
  }

  const hero = product.images?.[0]?.src || product.image;
  const ogImage = hero ? storefrontImageUrl(hero, 1200).src : undefined;

  return {
    title: `${product.name} | Vibe Music`,
    description: product.description?.slice(0, 160) ?? product.name,
    openGraph: {
      title: product.name,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  const product = await loadProductCorePage(slug);

  if (!product) {
    notFound();
  }

  const initialData = toInitialData(product);
  const heroRaw = product.images?.[0]?.src || product.image;
  const heroImageUrl = heroRaw
    ? storefrontImageUrl(heroRaw, 1200).src
    : undefined;

  return (
    <main className="storefront-page">
      {heroImageUrl ? (
        <link rel="preload" as="image" href={heroImageUrl} fetchPriority="high" />
      ) : null}
      <ProductDetailPage slug={slug} initialData={initialData} />
    </main>
  );
}

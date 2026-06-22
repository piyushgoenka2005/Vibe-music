import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";

const ProductDetailPage = dynamic(
  () => import("@/components/product/ProductDetailPage")
);

export const dynamicParams = true;
export const revalidate = 60;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadProductDetailPage(slug);
  if (!data) {
    return { title: "Product not found | Vibe Music" };
  }

  return {
    title: `${data.product.name} | Vibe Music`,
    description: data.product.description?.slice(0, 160) ?? data.product.name,
    openGraph: {
      title: data.product.name,
      images: data.product.image ? [{ url: data.product.image }] : undefined,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  const initialData = await loadProductDetailPage(slug);

  if (!initialData) {
    notFound();
  }

  const heroImageUrl = initialData.product.images?.[0]?.src || initialData.product.image;

  return (
    <main className="storefront-page">
      {heroImageUrl ? (
        <link rel="preload" as="image" href={heroImageUrl} fetchPriority="high" />
      ) : null}
      <ProductDetailPage slug={slug} initialData={initialData} />
    </main>
  );
}

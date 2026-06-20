import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductDetailPage } from "@/lib/server/productDetailLoader";

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

  return (
    <main className="storefront-page">
      <ProductDetailPage slug={slug} initialData={initialData} />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { getAllProductSlugs, getProductDetailBySlug } from "@/data/productDetails";
import { pageTitle } from "@/lib/site";

export const revalidate = 60;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) return { title: pageTitle("Product") };
  return {
    title: pageTitle(product.name),
    description: product.description.slice(0, 160),
  };
}

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  const product = getProductDetailBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <ProductDetailPage slug={slug} />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

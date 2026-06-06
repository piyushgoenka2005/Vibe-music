import HtmlSection from "@/components/sweetwater/HtmlSection";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { getAllProductSlugs } from "@/data/productDetails";

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;

  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <ProductDetailPage slug={slug} />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

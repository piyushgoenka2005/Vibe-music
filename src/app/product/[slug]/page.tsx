import HtmlSection from "@/components/vibe/HtmlSection";
import ProductDetailPage from "@/components/product/ProductDetailPage";

export const dynamicParams = true;

interface ProductRouteProps {
  params: Promise<{ slug: string }>;
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

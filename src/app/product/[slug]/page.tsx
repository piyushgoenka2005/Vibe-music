import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailPage from "@/components/product/ProductDetailPage";
import { loadProductCorePage } from "@/lib/server/productDetailLoader";
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

  return {
    title: `${product.name} | Vibe Music`,
    description: product.description?.slice(0, 160) ?? product.name,
    openGraph: {
      title: product.name,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { slug } = await params;
  // #region agent log
  const _pdpRouteStart = Date.now();
  fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'product/[slug]/page.tsx:route',message:'PDP SSR route start',data:{slug},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const product = await loadProductCorePage(slug);
  // #region agent log
  fetch('http://127.0.0.1:7828/ingest/1d696600-63a8-447a-b1d2-58422acef253',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'88ed4c'},body:JSON.stringify({sessionId:'88ed4c',location:'product/[slug]/page.tsx:route',message:'PDP SSR loadProductCorePage done',data:{slug,found:Boolean(product),ms:Date.now()-_pdpRouteStart},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (!product) {
    notFound();
  }

  const initialData = toInitialData(product);
  const heroImageUrl = product.images?.[0]?.src || product.image;

  return (
    <main className="storefront-page">
      {heroImageUrl ? (
        <link rel="preload" as="image" href={heroImageUrl} fetchPriority="high" />
      ) : null}
      <ProductDetailPage slug={slug} initialData={initialData} />
    </main>
  );
}

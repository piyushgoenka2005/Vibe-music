import type { Product, ProductDetail } from "@/types/product";
import type { ResolvedProductBundle } from "@/types/bundle";

export interface ProductDetailResult {
  product: ProductDetail;
  bundle: ResolvedProductBundle | null;
  frequentlyBoughtTogether: Product[];
  similarProducts: Product[];
  relatedProducts: Product[];
}

export async function fetchProductDetail(
  slug: string
): Promise<ProductDetailResult | null> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return (await res.json()) as ProductDetailResult;
}

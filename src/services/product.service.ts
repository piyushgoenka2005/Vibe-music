import type { Product, ProductDetail } from "@/types/product";

const DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ProductDetailResult {
  product: ProductDetail;
  frequentlyBoughtTogether: Product[];
  similarProducts: Product[];
  relatedProducts: Product[];
}

export async function fetchProductDetail(
  slug: string
): Promise<ProductDetailResult | null> {
  await delay(DELAY_MS);
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as ProductDetailResult;
}

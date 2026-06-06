import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";

const COLLECTION = "products";

export function getStaticCatalog(): Product[] {
  return PRODUCTS;
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  if (typeof window === "undefined") {
    return getStaticCatalog();
  }

  try {
    const response = await fetch("/api/catalog/products", { cache: "no-store" });
    if (!response.ok) return getStaticCatalog();
    const data = (await response.json()) as { products?: Product[] };
    return data.products?.length ? data.products : getStaticCatalog();
  } catch {
    return getStaticCatalog();
  }
}

export { COLLECTION as PRODUCTS_COLLECTION };

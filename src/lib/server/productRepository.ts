import {
  searchProducts as catalogSearchProducts,
  type ProductSearchOptions,
} from "@/services/catalogService";
import type { Product } from "@/types/product";

export type { ProductSearchOptions };

export async function listProducts(): Promise<Product[]> {
  return catalogSearchProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { getProductBySlug: getBySlug } = await import(
    "@/services/catalogService"
  );
  return (await getBySlug(slug)) ?? null;
}

export async function searchProducts(
  options: ProductSearchOptions = {}
): Promise<Product[]> {
  return catalogSearchProducts(options);
}

import "server-only";

import { searchProducts } from "@/lib/server/productRepository";
import type { Product } from "@/types/product";
import type { SearchBrand, SearchCategory } from "@/types/search";

export const SEARCH_MIN_QUERY_LENGTH = 2;

export interface SearchResultsPayload {
  query: string;
  products: Product[];
  categories: SearchCategory[];
  brands: SearchBrand[];
  total: number;
}

export function buildCategoryFacets(products: Product[]): SearchCategory[] {
  const map = new Map<string, SearchCategory>();

  products.forEach((product) => {
    if (!map.has(product.categorySlug)) {
      map.set(product.categorySlug, {
        id: product.categorySlug,
        name: product.category,
        slug: product.categorySlug,
      });
    }
  });

  return Array.from(map.values());
}

export function buildBrandFacets(products: Product[]): SearchBrand[] {
  const map = new Map<string, SearchBrand>();

  products.forEach((product) => {
    if (!map.has(product.brandSlug)) {
      map.set(product.brandSlug, {
        id: product.brandSlug,
        name: product.brand,
        slug: product.brandSlug,
      });
    }
  });

  return Array.from(map.values());
}

export async function getSearchResults(options: {
  query: string;
  category?: string;
  brand?: string;
  sort?: string;
}): Promise<SearchResultsPayload> {
  const query = options.query.trim();
  const products = await searchProducts({
    query,
    category: options.category,
    brand: options.brand,
    sort: options.sort,
  });

  return {
    query,
    products,
    categories: buildCategoryFacets(products),
    brands: buildBrandFacets(products),
    total: products.length,
  };
}

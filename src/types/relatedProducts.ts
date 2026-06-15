import type { Product } from "@/types/product";

export const MAX_RELATED_PRODUCTS = 8;

export interface ProductRelatedList {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  relatedProductIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductRelatedListInput {
  relatedProductIds: string[];
  isActive?: boolean;
  productName?: string;
  productSlug?: string;
}

export interface ResolvedRelatedProducts {
  products: Product[];
  source: "manual" | "mixed" | "fallback";
}

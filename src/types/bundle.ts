export interface ProductBundle {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  relatedProductIds: string[];
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProductBundleInput {
  relatedProductIds: string[];
  discountPercent?: number;
  isActive?: boolean;
  productName?: string;
  productSlug?: string;
}

import type { Product } from "@/types/product";

export interface ResolvedProductBundle {
  discountPercent: number;
  subtotal: number;
  bundlePrice: number;
  savings: number;
  items: Product[];
}

export const DEFAULT_BUNDLE_DISCOUNT_PERCENT = 8;

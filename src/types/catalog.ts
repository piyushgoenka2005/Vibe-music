import type {
  ProductAvailability,
  ProductCondition,
  ProductImage,
  ProductQA,
  ProductReview,
  ProductSpec,
  ProductVariant,
  ProductVideo,
} from "@/types/product";

export type ProductStatus = "active" | "draft" | "archived";

/** Canonical catalog product schema — stored in products.json (single source of truth). */
export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  status: ProductStatus;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  brandSlug: string;
  categorySlug: string;
  availability: ProductAvailability;
  condition: ProductCondition;
  imageColor: string;
  image: string;
  gstRate?: 5 | 12 | 18 | 28;
  detail?: CatalogProductDetail;
}

export interface CatalogProductDetail {
  msrp: number | null;
  salePrice: number | null;
  specs: ProductSpec[];
  inTheBox: string[];
  gallery: ProductImage[];
  videos: ProductVideo[];
  variants: ProductVariant[];
  reviews: ProductReview[];
  qa: ProductQA[];
  frequentlyBoughtTogether: string[];
  similarProductIds: string[];
  relatedProductIds: string[];
}

export interface CreateProductInput {
  name: string;
  brand: string;
  category: string;
  categorySlug?: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  status?: ProductStatus;
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  images?: string[];
  description?: string;
  specifications?: Record<string, string>;
  slug?: string;
  brandSlug?: string;
  rating?: number;
  reviewCount?: number;
  availability?: ProductAvailability;
  condition?: ProductCondition;
  imageColor?: string;
  image?: string;
  gstRate?: 5 | 12 | 18 | 28;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  discountPercentage?: number;
}

export interface BulkImportRow {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  description?: string;
  featured?: string | boolean;
  trending?: string | boolean;
  newArrival?: string | boolean;
  image1?: string;
  image2?: string;
  image3?: string;
}

export interface BulkImportPreviewRow extends BulkImportRow {
  rowNumber: number;
  errors: string[];
  valid: boolean;
  resolvedCategorySlug?: string;
  generatedSlug?: string;
  generatedSku?: string;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: number;
  failedRows: Array<BulkImportPreviewRow & { reason: string }>;
  products: CatalogProduct[];
}

export interface BulkDeleteResult {
  deleted: number;
}

export interface BulkStatusResult {
  updated: number;
}

export interface BulkStockUpdate {
  id: string;
  stock: number;
}

export interface BulkCategoryUpdate {
  id: string;
  category: string;
  categorySlug: string;
}

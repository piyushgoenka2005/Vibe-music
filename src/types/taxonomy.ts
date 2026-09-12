export interface CatalogTaxonomyItem {
  id: string;
  category: string;
  subcategory: string;
  variant?: string | null;
  productType: string;
  instrumentFamily?: string | null;
  seoSlug: string;
  googleProductCategory?: string | null;
  menuLevel1?: string | null;
  menuLevel2?: string | null;
  menuLevel3?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RawTaxonomyRow {
  category: string;
  subcategory: string;
  variant?: string | null;
  productType: string;
  instrumentFamily?: string | null;
  seoSlug: string;
  googleProductCategory?: string | null;
  menuLevel1?: string | null;
  menuLevel2?: string | null;
  menuLevel3?: string | null;
}

export interface TaxonomyStats {
  totalNodes: number;
  distinctCategories: number;
  distinctSubcategories: number;
  distinctProductTypes: number;
  distinctGoogleCategories: number;
}

export interface TaxonomyImportResult {
  totalRowsRead: number;
  uniqueRowsImported: number;
  duplicatesSkipped: number;
  categoriesProvisioned?: number;
  durationMs: number;
}

export interface TaxonomyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subcategory?: string;
}

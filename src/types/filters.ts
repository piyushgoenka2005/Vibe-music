export type SortOption = "relevance" | "price-asc" | "price-desc" | "rating-desc";

export type ViewMode = "grid" | "list";

export type AvailabilityFilter = "all" | "in-stock" | "out-of-stock" | "limited";

export type ProductConditionFilter = "new" | "used" | "open-box";

export interface FacetOption {
  slug: string;
  name: string;
  count: number;
}

export interface SpecFacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
}

export interface CategoryFilters {
  brands: string[];
  categories: string[];
  subcategories: string[];
  specs: Record<string, string[]>;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  availability: AvailabilityFilter;
  conditions: ProductConditionFilter[];
  sort: SortOption;
  view: ViewMode;
  page: number;
}

export interface CategoryProductsResult {
  products: import("@/types/product").Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    brands: FacetOption[];
    categories: FacetOption[];
    subcategories: FacetOption[];
    specs: SpecFacetGroup[];
    priceRange: { min: number; max: number };
  };
}

export const DEFAULT_FACETS: CategoryProductsResult["facets"] = {
  brands: [],
  categories: [],
  subcategories: [],
  specs: [],
  priceRange: { min: 0, max: 0 },
};

export const DEFAULT_FILTERS: CategoryFilters = {
  brands: [],
  categories: [],
  subcategories: [],
  specs: {},
  minPrice: null,
  maxPrice: null,
  rating: null,
  availability: "all",
  conditions: [],
  sort: "relevance",
  view: "grid",
  page: 1,
};

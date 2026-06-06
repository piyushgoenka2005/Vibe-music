export type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating-desc";

export type ViewMode = "grid" | "list";

export type AvailabilityFilter = "all" | "in-stock" | "out-of-stock" | "limited";

export interface CategoryFilters {
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  availability: AvailabilityFilter;
  conditions: ProductConditionFilter[];
  sort: SortOption;
  view: ViewMode;
  page: number;
}

export type ProductConditionFilter = "new" | "used" | "open-box";

export interface CategoryProductsResult {
  products: import("@/types/product").Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
}

export const DEFAULT_FILTERS: CategoryFilters = {
  brands: [],
  minPrice: null,
  maxPrice: null,
  rating: null,
  availability: "all",
  conditions: [],
  sort: "relevance",
  view: "grid",
  page: 1,
};

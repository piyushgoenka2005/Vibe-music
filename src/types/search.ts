export type SuggestionType = "product" | "category" | "brand" | "recent";

export interface SearchProduct {
  id: string;
  brand: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  image: string;
  imageColor?: string;
  rating?: number;
  reviewCount?: number;
  availability?: "in-stock" | "out-of-stock" | "limited";
}

export interface SearchCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SearchBrand {
  id: string;
  name: string;
  slug: string;
}

export interface SearchSuggestion {
  id: string;
  type: SuggestionType;
  label: string;
  sublabel?: string;
  href: string;
  productSlug?: string;
}

export interface SearchSuggestionGroups {
  products: SearchSuggestion[];
  categories: SearchSuggestion[];
  brands: SearchSuggestion[];
  recent: SearchSuggestion[];
}

export interface SearchResultsData {
  query: string;
  products: SearchProduct[];
  categories: SearchCategory[];
  brands: SearchBrand[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface SearchAnalyticsEvent {
  query: string;
  timestamp: number;
  resultCount: number;
  source: SearchAnalyticsSource;
}

export type SearchAnalyticsSource =
  | "autocomplete"
  | "results-page"
  | "submit";

export interface SearchFiltersState {
  category: string;
  brand: string;
  sort: "relevance" | "price-asc" | "price-desc";
}

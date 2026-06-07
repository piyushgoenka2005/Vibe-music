export type SuggestionType = "product" | "category" | "brand" | "recent";

export interface SearchProduct {
  id: string;
  brand: string;
  name: string;
  slug: string;
  category: string;
  price: number;
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
}

export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface SearchAnalyticsEvent {
  query: string;
  timestamp: number;
  resultCount: number;
  source: "autocomplete" | "results-page" | "submit";
}

export interface SearchFiltersState {
  category: string;
  brand: string;
  sort: "relevance" | "price-asc" | "price-desc";
}

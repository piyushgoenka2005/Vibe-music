import {
  buildBrandHints,
  buildEmptyStateSuggestions,
  buildKeywordSuggestions,
  categorySuggestionHref,
  enrichKeywordSuggestions,
  getPopularQueriesFromAnalytics,
  matchesSearchQuery,
} from "@/lib/search/searchIntelligence";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import { productPath, ROUTES } from "@/lib/routes";
import { fetchProductSummaries } from "@/services/products.api";
import type {
  SearchResultsData,
  SearchSuggestion,
  SearchSuggestionGroups,
} from "@/types/search";

const MIN_QUERY_LENGTH = 2;
const SUGGEST_CACHE_TTL_MS = 60_000;

export interface SearchSuggestionsOptions {
  recentlyViewedIds?: string[];
  popularQueries?: string[];
}

interface SearchApiResultsResponse {
  query: string;
  products: SearchResultsData["products"];
  categories: SearchResultsData["categories"];
  brands: SearchResultsData["brands"];
  total: number;
  error?: string;
}

interface SearchApiSuggestResponse {
  products: Array<{
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    image?: string;
  }>;
  categories: SearchResultsData["categories"];
  brands: SearchResultsData["brands"];
  error?: string;
}

const suggestCache = new Map<string, { data: SearchApiSuggestResponse; at: number }>();

const EMPTY_GROUPS: SearchSuggestionGroups = {
  keywords: [],
  categories: [],
  brands: [],
  products: [],
  recentlyViewed: [],
  recent: [],
};

async function readSearchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Search request failed");
  }

  return body;
}

function readSuggestCache(query: string): SearchApiSuggestResponse | null {
  const exact = suggestCache.get(query);
  if (exact && Date.now() - exact.at <= SUGGEST_CACHE_TTL_MS) {
    return exact.data;
  }
  if (exact) suggestCache.delete(query);

  let bestMatch: { data: SearchApiSuggestResponse; at: number; key: string } | null =
    null;

  for (const [key, entry] of suggestCache.entries()) {
    if (Date.now() - entry.at > SUGGEST_CACHE_TTL_MS) {
      suggestCache.delete(key);
      continue;
    }
    if (query.startsWith(key) && key.length >= MIN_QUERY_LENGTH) {
      if (!bestMatch || key.length > bestMatch.key.length) {
        bestMatch = { data: entry.data, at: entry.at, key };
      }
    }
  }

  return bestMatch?.data ?? null;
}

function writeSuggestCache(query: string, data: SearchApiSuggestResponse) {
  suggestCache.set(query, { data, at: Date.now() });
}

function mapRecentSearches(
  recentSearches: string[],
  query: string,
  limit = 5
): SearchSuggestion[] {
  const trimmed = query.trim();
  const filtered = trimmed
    ? recentSearches.filter((item) => matchesSearchQuery(item, trimmed))
    : recentSearches;

  return filtered.slice(0, limit).map((item, index) => ({
    id: `recent-${index}-${item}`,
    type: "recent" as const,
    label: item,
    href: `${ROUTES.searchResults}?q=${encodeURIComponent(item)}`,
  }));
}

function mergeBrandSuggestions(
  apiBrands: SearchResultsData["brands"],
  query: string,
  limit = 5
): SearchSuggestion[] {
  const seen = new Set<string>();
  const results: SearchSuggestion[] = [];

  for (const brand of apiBrands) {
    if (!matchesSearchQuery(brand.name, query)) continue;
    const key = brand.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      id: brand.id,
      type: "brand",
      label: brand.name,
      href: `${ROUTES.searchResults}?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand.slug)}`,
    });
    if (results.length >= limit) return results;
  }

  for (const hint of buildBrandHints(query, limit)) {
    const key = hint.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(hint);
    if (results.length >= limit) return results;
  }

  return results;
}

function hasSuggestionResults(
  groups: Omit<SearchSuggestionGroups, "recent" | "recentlyViewed">
): boolean {
  return (
    groups.keywords.length +
      groups.categories.length +
      groups.brands.length +
      groups.products.length >
    0
  );
}

function withDiscoveryFallback(
  groups: SearchSuggestionGroups
): SearchSuggestionGroups {
  if (hasSuggestionResults(groups)) return groups;

  const discovery = buildEmptyStateSuggestions();
  return {
    ...groups,
    keywords: discovery.trending,
    categories: discovery.categories,
    brands: discovery.brands,
  };
}

export async function mapRecentlyViewedSuggestions(
  recentlyViewedIds: string[],
  query: string,
  limit = 4
): Promise<SearchSuggestion[]> {
  if (recentlyViewedIds.length === 0) return [];

  try {
    const products = await fetchProductSummaries(recentlyViewedIds.slice(0, 8));
    const trimmed = query.trim();
    const filtered = trimmed
      ? products.filter(
          (product) =>
            matchesSearchQuery(formatProductCardTitle(product.name, product.brand), trimmed) ||
            matchesSearchQuery(product.brand, trimmed) ||
            matchesSearchQuery(product.name, trimmed)
        )
      : products;

    return filtered.slice(0, limit).map((product) => ({
      id: `viewed-${product.id}`,
      type: "viewed" as const,
      label: formatProductCardTitle(product.name, product.brand),
      sublabel: product.brand,
      productSlug: product.slug,
      image: product.image,
      price: product.price,
      href: productPath(product.slug),
    }));
  } catch {
    return [];
  }
}

export function buildClientSearchSuggestions(
  query: string,
  recentSearches: string[] = [],
  options: SearchSuggestionsOptions = {}
): SearchSuggestionGroups {
  const trimmed = query.trim();
  const popularQueries = options.popularQueries ?? [];

  return {
    keywords: buildKeywordSuggestions(trimmed, 8, popularQueries),
    categories: [],
    brands: trimmed ? buildBrandHints(trimmed) : [],
    products: [],
    recentlyViewed: [],
    recent: mapRecentSearches(recentSearches, trimmed),
  };
}

export async function fetchSearchSuggestions(
  query: string,
  recentSearches: string[] = [],
  options: SearchSuggestionsOptions = {}
): Promise<SearchSuggestionGroups> {
  const trimmed = query.trim();
  const popularQueries = options.popularQueries ?? [];
  const recentlyViewedIds = options.recentlyViewedIds ?? [];
  const recent = mapRecentSearches(recentSearches, trimmed);

  if (trimmed.length < MIN_QUERY_LENGTH) {
    const recentlyViewed = await mapRecentlyViewedSuggestions(
      recentlyViewedIds,
      trimmed
    );
    return {
      keywords: buildKeywordSuggestions(trimmed, 8, popularQueries),
      categories: [],
      brands: trimmed ? buildBrandHints(trimmed) : [],
      products: [],
      recentlyViewed,
      recent,
    };
  }

  let data = readSuggestCache(trimmed);
  if (!data) {
    const params = new URLSearchParams({
      q: trimmed,
      mode: "suggest",
    });
    data = await readSearchApi<SearchApiSuggestResponse>(
      `/api/search?${params.toString()}`
    );
    writeSuggestCache(trimmed, data);
  }

  const products = data.products.map((product) => ({
    id: product.id,
    type: "product" as const,
    label: formatProductCardTitle(product.name, product.brand),
    sublabel: product.brand,
    productSlug: product.slug,
    image: product.image,
    price: product.price,
    href: productPath(product.slug),
  }));

  const categories = data.categories
    .filter((category) => matchesSearchQuery(category.name, trimmed))
    .map((category) => ({
      id: category.id,
      type: "category" as const,
      label: category.name,
      href: categorySuggestionHref(category.slug),
    }));

  const brands = mergeBrandSuggestions(data.brands, trimmed);
  const facetLabels = [
    ...data.categories.map((category) => category.name),
    ...data.brands.map((brand) => brand.name),
  ];
  const keywords = enrichKeywordSuggestions(
    buildKeywordSuggestions(trimmed, 8, popularQueries),
    facetLabels,
    trimmed
  );

  const recentlyViewed = await mapRecentlyViewedSuggestions(
    recentlyViewedIds,
    trimmed
  );

  return withDiscoveryFallback({
    keywords,
    categories,
    brands,
    products,
    recentlyViewed,
    recent,
  });
}

export async function fetchSearchResults(
  query: string,
  filters?: {
    category?: string;
    subcategory?: string;
    brand?: string;
    sort?: string;
    /** Return every match for client-side listing filters (category layout). */
    all?: boolean;
  }
): Promise<SearchResultsData> {
  const trimmed = query.trim();
  const hasFilter = Boolean(
    filters?.category?.trim() ||
      filters?.subcategory?.trim() ||
      filters?.brand?.trim()
  );

  if (trimmed.length < MIN_QUERY_LENGTH && !hasFilter) {
    return {
      query: trimmed,
      products: [],
      categories: [],
      brands: [],
      total: 0,
    };
  }

  const params = new URLSearchParams();
  if (trimmed) params.set("q", trimmed);
  params.set("mode", "results");
  if (filters?.all) params.set("all", "1");
  if (filters?.category) params.set("category", filters.category);
  if (filters?.subcategory) params.set("subcategory", filters.subcategory);
  if (!filters?.all) {
    if (filters?.brand) params.set("brand", filters.brand);
    if (filters?.sort && filters.sort !== "relevance") {
      params.set("sort", filters.sort);
    }
  }

  return readSearchApi<SearchApiResultsResponse>(
    `/api/search?${params.toString()}`
  );
}

export { MIN_QUERY_LENGTH, EMPTY_GROUPS as SEARCH_EMPTY_GROUPS };

export function buildPopularQueriesFromStore(
  analytics: Array<{ query: string }>
): string[] {
  return getPopularQueriesFromAnalytics(analytics);
}

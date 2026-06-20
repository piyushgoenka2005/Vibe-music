import type {
  SearchResultsData,
  SearchSuggestionGroups,
} from "@/types/search";

const MIN_QUERY_LENGTH = 2;

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
  }>;
  categories: SearchResultsData["categories"];
  brands: SearchResultsData["brands"];
  error?: string;
}

async function readSearchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Search request failed");
  }

  return body;
}

export async function fetchSearchSuggestions(
  query: string,
  recentSearches: string[] = []
): Promise<SearchSuggestionGroups> {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      products: [],
      categories: [],
      brands: [],
      recent: recentSearches.slice(0, 5).map((item, index) => ({
        id: `recent-${index}`,
        type: "recent" as const,
        label: item,
        href: `/search/results?q=${encodeURIComponent(item)}`,
      })),
    };
  }

  const params = new URLSearchParams({
    q: trimmed,
    mode: "suggest",
  });

  const data = await readSearchApi<SearchApiSuggestResponse>(
    `/api/search?${params.toString()}`
  );

  const products = data.products.map((product) => ({
    id: product.id,
    type: "product" as const,
    label: product.name,
    sublabel: product.brand,
    productSlug: product.slug,
    href: `/search/results?q=${encodeURIComponent(trimmed)}&product=${product.slug}`,
  }));

  const categories = data.categories.map((category) => ({
    id: category.id,
    type: "category" as const,
    label: category.name,
    href: `/search/results?q=${encodeURIComponent(trimmed)}&category=${category.slug}`,
  }));

  const brands = data.brands.map((brand) => ({
    id: brand.id,
    type: "brand" as const,
    label: brand.name,
    href: `/search/results?q=${encodeURIComponent(trimmed)}&brand=${brand.slug}`,
  }));

  const recent = recentSearches
    .filter((item) => item.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 3)
    .map((item, index) => ({
      id: `recent-match-${index}`,
      type: "recent" as const,
      label: item,
      href: `/search/results?q=${encodeURIComponent(item)}`,
    }));

  return { products, categories, brands, recent };
}

export async function fetchSearchResults(
  query: string,
  filters?: { category?: string; brand?: string; sort?: string }
): Promise<SearchResultsData> {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      query: trimmed,
      products: [],
      categories: [],
      brands: [],
      total: 0,
    };
  }

  const params = new URLSearchParams({ q: trimmed, mode: "results" });
  if (filters?.category) params.set("category", filters.category);
  if (filters?.brand) params.set("brand", filters.brand);
  if (filters?.sort && filters.sort !== "relevance") {
    params.set("sort", filters.sort);
  }

  return readSearchApi<SearchApiResultsResponse>(
    `/api/search?${params.toString()}`
  );
}

export { MIN_QUERY_LENGTH };

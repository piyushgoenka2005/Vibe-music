import {
  RECOMMENDED_PRODUCTS,
  SEARCH_BRANDS,
  SEARCH_CATEGORIES,
  SEARCH_PRODUCTS,
} from "@/data/searchCatalog";
import type {
  SearchResultsData,
  SearchSuggestionGroups,
} from "@/types/search";

const MIN_QUERY_LENGTH = 2;
const REQUEST_DELAY_MS = 180;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matches(query: string, target: string): boolean {
  return normalize(target).includes(normalize(query));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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

  await delay(REQUEST_DELAY_MS);

  const products = SEARCH_PRODUCTS.filter(
    (product) =>
      matches(trimmed, product.name) ||
      matches(trimmed, product.brand) ||
      matches(trimmed, product.category)
  )
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      type: "product" as const,
      label: product.name,
      sublabel: product.brand,
      href: `/search/results?q=${encodeURIComponent(trimmed)}&product=${product.slug}`,
    }));

  const categories = SEARCH_CATEGORIES.filter((category) =>
    matches(trimmed, category.name)
  )
    .slice(0, 4)
    .map((category) => ({
      id: category.id,
      type: "category" as const,
      label: category.name,
      href: `/search/results?q=${encodeURIComponent(trimmed)}&category=${category.slug}`,
    }));

  const brands = SEARCH_BRANDS.filter((brand) => matches(trimmed, brand.name))
    .slice(0, 4)
    .map((brand) => ({
      id: brand.id,
      type: "brand" as const,
      label: brand.name,
      href: `/search/results?q=${encodeURIComponent(trimmed)}&brand=${brand.slug}`,
    }));

  const recent = recentSearches
    .filter((item) => matches(trimmed, item))
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
  filters?: {
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }
): Promise<SearchResultsData> {
  const trimmed = query.trim();
  await delay(REQUEST_DELAY_MS);

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      query: trimmed,
      products: [],
      categories: [],
      brands: [],
      total: 0,
    };
  }

  let products = SEARCH_PRODUCTS.filter(
    (product) =>
      matches(trimmed, product.name) ||
      matches(trimmed, product.brand) ||
      matches(trimmed, product.category)
  );

  const categoryFilter = filters?.category;
  if (categoryFilter) {
    products = products.filter(
      (product) =>
        product.categorySlug === categoryFilter ||
        product.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter ||
        product.category.toLowerCase() === categoryFilter.replace(/-/g, " ")
    );
  }

  const brandFilter = filters?.brand;
  if (brandFilter) {
    products = products.filter(
      (product) =>
        product.brandSlug === brandFilter ||
        product.brand.toLowerCase().replace(/\s+/g, "-") === brandFilter ||
        product.brand.toLowerCase() === brandFilter.replace(/-/g, " ")
    );
  }

  const minPrice = filters?.minPrice ? Number(filters.minPrice) : null;
  const maxPrice = filters?.maxPrice ? Number(filters.maxPrice) : null;
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    products = products.filter((product) => product.price >= minPrice);
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    products = products.filter((product) => product.price <= maxPrice);
  }

  if (filters?.sort === "price-asc") {
    products = [...products].sort((a, b) => a.price - b.price);
  } else if (filters?.sort === "price-desc") {
    products = [...products].sort((a, b) => b.price - a.price);
  }

  const categories = SEARCH_CATEGORIES.filter((category) =>
    matches(trimmed, category.name)
  );

  const brands = SEARCH_BRANDS.filter((brand) => matches(trimmed, brand.name));

  return {
    query: trimmed,
    products,
    categories,
    brands,
    total: products.length,
  };
}

export function getRecommendedProducts() {
  return RECOMMENDED_PRODUCTS;
}

export { MIN_QUERY_LENGTH };

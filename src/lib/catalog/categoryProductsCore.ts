import type { Product } from "@/types/product";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";

export const CATEGORY_PAGE_SIZE = 12;

function sortProducts(products: Product[], sort: CategoryFilters["sort"]): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating-desc":
      return copy.sort((a, b) => b.rating - a.rating);
    default:
      return copy;
  }
}

function applyFilters(products: Product[], filters: CategoryFilters): Product[] {
  let result = products;

  if (filters.brands.length > 0) {
    result = result.filter((p) => filters.brands.includes(p.brandSlug));
  }

  if (filters.minPrice !== null) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== null) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.rating !== null) {
    result = result.filter((p) => p.rating >= filters.rating!);
  }

  if (filters.availability !== "all") {
    result = result.filter((p) => p.availability === filters.availability);
  }

  if (filters.conditions.length > 0) {
    result = result.filter((p) => filters.conditions.includes(p.condition));
  }

  return result;
}

function buildBrandFacets(products: Product[]) {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((p) => {
    const existing = counts.get(p.brandSlug);
    if (existing) existing.count += 1;
    else counts.set(p.brandSlug, { name: p.brand, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildCategoryProductsResult(
  categoryProducts: Product[],
  filters: CategoryFilters
): CategoryProductsResult {
  const filtered = applyFilters(categoryProducts, filters);
  const sorted = sortProducts(filtered, filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * CATEGORY_PAGE_SIZE;
  const products = sorted.slice(start, start + CATEGORY_PAGE_SIZE);

  const prices = categoryProducts
    .map((p) => p.price)
    .filter((price) => price > 0);

  return {
    products,
    total,
    page,
    pageSize: CATEGORY_PAGE_SIZE,
    totalPages,
    facets: {
      brands: buildBrandFacets(categoryProducts),
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    },
  };
}

import { PRODUCTS } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import type { Product } from "@/types/product";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";

const PAGE_SIZE = 12;
const REQUEST_DELAY_MS = 200;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function fetchCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters
): Promise<CategoryProductsResult> {
  await delay(REQUEST_DELAY_MS);

  const category = getCategoryBySlug(categorySlug);
  if (!category) {
    return {
      products: [],
      total: 0,
      page: filters.page,
      pageSize: PAGE_SIZE,
      totalPages: 0,
      facets: { brands: [], priceRange: { min: 0, max: 0 } },
    };
  }

  const categoryProducts = PRODUCTS.filter(
    (p) => p.categorySlug === categorySlug
  );
  const filtered = applyFilters(categoryProducts, filters);
  const sorted = sortProducts(filtered, filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const products = sorted.slice(start, start + PAGE_SIZE);

  const prices = categoryProducts.map((p) => p.price);

  return {
    products,
    total,
    page,
    pageSize: PAGE_SIZE,
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

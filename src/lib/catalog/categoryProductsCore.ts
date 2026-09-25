import type { Product } from "@/types/product";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";
import { normalizeCategoryFilters } from "@/lib/filterUrl";
import { slugify } from "@/lib/slug";
import { specValueSlug } from "@/lib/catalog/listingFilterSpecs";

export const CATEGORY_PAGE_SIZE = 12;

/** Category facet slug for guitar/studio amplifiers (split from parent category counts). */
export const AMPLIFIER_FACET_SLUG = "amplifier";

export function isAmplifierProduct(product: Pick<Product, "subcategory" | "name">): boolean {
  const subcategory = product.subcategory?.trim() ?? "";
  if (/amplifier/i.test(subcategory)) return true;
  return /\bamplifier\b/i.test(product.name);
}

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

type FilterExclusion = "brands" | "subcategories" | "categories" | "specs";

function productMatchesSpecs(product: Product, specs: Record<string, string[]>): boolean {
  const filterSpecs = product.filterSpecs;
  if (!filterSpecs) return Object.keys(specs).length === 0;

  return Object.entries(specs).every(([label, valueSlugs]) => {
    if (!valueSlugs.length) return true;
    const productValue = filterSpecs[label];
    if (!productValue) return false;
    return valueSlugs.includes(specValueSlug(productValue));
  });
}

function applyFilters(
  products: Product[],
  filters: CategoryFilters,
  exclude?: FilterExclusion,
): Product[] {
  let result = products;

  if (exclude !== "brands" && filters.brands.length > 0) {
    const activeBrands = new Set(filters.brands.map((brand) => brand.toLowerCase()));
    result = result.filter((product) => activeBrands.has(product.brandSlug.toLowerCase()));
  }

  if (exclude !== "categories" && filters.categories.length > 0) {
    const activeCategories = new Set(filters.categories.map((slug) => slug.toLowerCase()));
    result = result.filter((product) =>
      Array.from(activeCategories).some((slug) => {
        if (slug === AMPLIFIER_FACET_SLUG) return isAmplifierProduct(product);
        return product.categorySlug.toLowerCase() === slug && !isAmplifierProduct(product);
      }),
    );
  }

  if (exclude !== "subcategories" && filters.subcategories.length > 0) {
    const activeSubcategories = new Set(filters.subcategories.map((slug) => slug.toLowerCase()));
    result = result.filter((product) => {
      const subcategorySlug = slugify(product.subcategory ?? "");
      return subcategorySlug && activeSubcategories.has(subcategorySlug);
    });
  }

  if (exclude !== "specs" && Object.keys(filters.specs).length > 0) {
    result = result.filter((product) => productMatchesSpecs(product, filters.specs));
  }

  if (filters.minPrice !== null) {
    result = result.filter((product) => product.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== null) {
    result = result.filter((product) => product.price <= filters.maxPrice!);
  }

  if (filters.rating !== null) {
    result = result.filter((product) => product.rating >= filters.rating!);
  }

  if (filters.availability !== "all") {
    result = result.filter((product) => product.availability === filters.availability);
  }

  if (filters.conditions.length > 0) {
    result = result.filter((product) => filters.conditions.includes(product.condition));
  }

  return result;
}

function buildBrandFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    const existing = counts.get(product.brandSlug);
    if (existing) existing.count += 1;
    else counts.set(product.brandSlug, { name: product.brand, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCategoryFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    if (isAmplifierProduct(product)) {
      const existing = counts.get(AMPLIFIER_FACET_SLUG);
      if (existing) existing.count += 1;
      else counts.set(AMPLIFIER_FACET_SLUG, { name: "Amplifier", count: 1 });
      return;
    }

    const existing = counts.get(product.categorySlug);
    if (existing) existing.count += 1;
    else counts.set(product.categorySlug, { name: product.category, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSubcategoryFacets(products: Product[]): FacetOption[] {
  const counts = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    const label = product.subcategory?.trim();
    if (!label) return;
    const slug = slugify(label);
    const existing = counts.get(slug);
    if (existing) existing.count += 1;
    else counts.set(slug, { name: label, count: 1 });
  });
  return Array.from(counts.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildSpecificationFacets(products: Product[]): SpecFacetGroup[] {
  const groups = new Map<string, Map<string, { name: string; count: number }>>();

  products.forEach((product) => {
    const specs = product.filterSpecs;
    if (!specs) return;
    for (const [label, value] of Object.entries(specs)) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const valueSlug = specValueSlug(trimmed);
      if (!groups.has(label)) groups.set(label, new Map());
      const bucket = groups.get(label)!;
      const existing = bucket.get(valueSlug);
      if (existing) existing.count += 1;
      else bucket.set(valueSlug, { name: trimmed, count: 1 });
    }
  });

  return Array.from(groups.entries())
    .map(([label, valueCounts]) => ({
      key: slugify(label),
      label,
      options: Array.from(valueCounts.entries())
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.options.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function getFilteredListingProducts(
  products: Product[],
  filtersInput: CategoryFilters,
): Product[] {
  const filters = normalizeCategoryFilters(filtersInput);
  return sortProducts(applyFilters(products, filters), filters.sort);
}

export function buildCategoryProductsResult(
  categoryProducts: Product[],
  filtersInput: CategoryFilters,
): CategoryProductsResult {
  const filters = normalizeCategoryFilters(filtersInput);
  const filtered = applyFilters(categoryProducts, filters);
  const sorted = sortProducts(filtered, filters.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * CATEGORY_PAGE_SIZE;
  const products = sorted.slice(start, start + CATEGORY_PAGE_SIZE);

  const prices = categoryProducts.map((product) => product.price).filter((price) => price > 0);

  const brandPool = applyFilters(categoryProducts, filters, "brands");
  const categoryPool = applyFilters(categoryProducts, filters, "categories");
  const subcategoryPool = applyFilters(categoryProducts, filters, "subcategories");
  const specPool = applyFilters(categoryProducts, filters, "specs");

  return {
    products,
    total,
    page,
    pageSize: CATEGORY_PAGE_SIZE,
    totalPages,
    facets: {
      brands: buildBrandFacets(brandPool),
      categories: buildCategoryFacets(categoryPool),
      subcategories: buildSubcategoryFacets(subcategoryPool),
      specs: buildSpecificationFacets(specPool),
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    },
  };
}

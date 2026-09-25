import {
  DEFAULT_FILTERS,
  type CategoryFilters,
  type ProductConditionFilter,
  type SortOption,
  type ViewMode,
} from "@/types/filters";
import { parseSpecSelection, serializeSpecSelection } from "@/lib/catalog/listingFilterSpecs";

const VALID_SORTS: SortOption[] = ["relevance", "price-asc", "price-desc", "rating-desc"];
const VALID_VIEWS: ViewMode[] = ["grid", "list"];
const VALID_CONDITIONS: ProductConditionFilter[] = ["new", "used", "open-box"];
const VALID_AVAILABILITY = ["all", "in-stock", "out-of-stock", "limited"] as const;

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseFiltersFromSearchParams(params: URLSearchParams): CategoryFilters {
  const sortParam = params.get("sort") as SortOption | null;
  const viewParam = params.get("view") as ViewMode | null;
  const availabilityParam = params.get("availability");

  return normalizeCategoryFilters({
    brands: parseCsv(params.get("brand")),
    categories: parseCsv(params.get("cat")),
    subcategories: parseCsv(params.get("subcat")),
    specs: parseSpecSelection(params.get("spec")),
    minPrice: parseNumber(params.get("minPrice")),
    maxPrice: parseNumber(params.get("maxPrice")),
    rating: parseNumber(params.get("rating")),
    availability: VALID_AVAILABILITY.includes(
      availabilityParam as (typeof VALID_AVAILABILITY)[number],
    )
      ? (availabilityParam as CategoryFilters["availability"])
      : DEFAULT_FILTERS.availability,
    conditions: params.get("condition")
      ? params
          .get("condition")!
          .split(",")
          .filter((condition): condition is ProductConditionFilter =>
            VALID_CONDITIONS.includes(condition as ProductConditionFilter),
          )
      : [],
    sort: sortParam && VALID_SORTS.includes(sortParam) ? sortParam : "relevance",
    view: viewParam && VALID_VIEWS.includes(viewParam) ? viewParam : "grid",
    page: Math.max(1, parseNumber(params.get("page")) ?? 1),
  });
}

/** Ensure legacy/partial filter objects always include the full CategoryFilters shape. */
export function normalizeCategoryFilters(filters: Partial<CategoryFilters>): CategoryFilters {
  return {
    ...DEFAULT_FILTERS,
    ...filters,
    brands: filters.brands ?? DEFAULT_FILTERS.brands,
    categories: filters.categories ?? DEFAULT_FILTERS.categories,
    subcategories: filters.subcategories ?? DEFAULT_FILTERS.subcategories,
    specs: filters.specs ?? DEFAULT_FILTERS.specs,
    conditions: filters.conditions ?? DEFAULT_FILTERS.conditions,
    page: Math.max(1, filters.page ?? DEFAULT_FILTERS.page),
  };
}

/** Merge filter patches; null clears nullable numeric fields. */
export function mergeCategoryFilters(
  current: CategoryFilters,
  patch: Partial<CategoryFilters>,
): CategoryFilters {
  const merged: Partial<CategoryFilters> = { ...current, ...patch };
  if (patch.minPrice === null) merged.minPrice = null;
  if (patch.maxPrice === null) merged.maxPrice = null;
  if (patch.rating === null) merged.rating = null;
  if (patch.minPrice === undefined) merged.minPrice = current.minPrice;
  if (patch.maxPrice === undefined) merged.maxPrice = current.maxPrice;
  if (patch.rating === undefined) merged.rating = current.rating;
  return normalizeCategoryFilters(merged);
}

export function filtersToSearchParams(
  filters: CategoryFilters,
  base?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base?.toString() ?? "");

  const setOrDelete = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  setOrDelete("brand", filters.brands.length ? filters.brands.join(",") : null);
  setOrDelete("cat", filters.categories.length ? filters.categories.join(",") : null);
  setOrDelete("subcat", filters.subcategories.length ? filters.subcategories.join(",") : null);
  setOrDelete("spec", serializeSpecSelection(filters.specs));
  setOrDelete("minPrice", filters.minPrice !== null ? String(filters.minPrice) : null);
  setOrDelete("maxPrice", filters.maxPrice !== null ? String(filters.maxPrice) : null);
  setOrDelete("rating", filters.rating !== null ? String(filters.rating) : null);
  setOrDelete("availability", filters.availability !== "all" ? filters.availability : null);
  setOrDelete("condition", filters.conditions.length ? filters.conditions.join(",") : null);
  setOrDelete("sort", filters.sort !== "relevance" ? filters.sort : null);
  setOrDelete("view", filters.view !== "grid" ? filters.view : null);
  setOrDelete("page", filters.page > 1 ? String(filters.page) : null);

  return params;
}

export function hasActiveFilters(filters: CategoryFilters): boolean {
  return countActiveFilters(filters) > 0;
}

/** Number of applied refine facets (excludes sort/view/page). */
export function countActiveFilters(filters: CategoryFilters): number {
  let count =
    filters.brands.length +
    filters.categories.length +
    filters.subcategories.length +
    filters.conditions.length;

  for (const values of Object.values(filters.specs)) {
    count += values.length;
  }

  if (filters.minPrice !== null) count += 1;
  if (filters.maxPrice !== null) count += 1;
  if (filters.rating !== null) count += 1;
  if (filters.availability !== "all") count += 1;
  return count;
}

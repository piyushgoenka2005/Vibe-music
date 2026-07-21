import {
  DEFAULT_FILTERS,
  type CategoryFilters,
  type ProductConditionFilter,
  type SortOption,
  type ViewMode,
} from "@/types/filters";

const VALID_SORTS: SortOption[] = [
  "relevance",
  "price-asc",
  "price-desc",
  "rating-desc",
];
const VALID_VIEWS: ViewMode[] = ["grid", "list"];
const VALID_CONDITIONS: ProductConditionFilter[] = ["new", "used", "open-box"];
const VALID_AVAILABILITY = ["all", "in-stock", "out-of-stock", "limited"] as const;

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams
): CategoryFilters {
  const brands = params.get("brand")
    ? params
        .get("brand")!
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
    : [];

  const conditions = params.get("condition")
    ? params
        .get("condition")!
        .split(",")
        .filter((c): c is ProductConditionFilter =>
          VALID_CONDITIONS.includes(c as ProductConditionFilter)
        )
    : [];

  const sortParam = params.get("sort") as SortOption | null;
  const viewParam = params.get("view") as ViewMode | null;
  const availabilityParam = params.get("availability");

  return {
    brands,
    minPrice: parseNumber(params.get("minPrice")),
    maxPrice: parseNumber(params.get("maxPrice")),
    rating: parseNumber(params.get("rating")),
    availability: VALID_AVAILABILITY.includes(
      availabilityParam as (typeof VALID_AVAILABILITY)[number]
    )
      ? (availabilityParam as CategoryFilters["availability"])
      : DEFAULT_FILTERS.availability,
    conditions,
    sort: sortParam && VALID_SORTS.includes(sortParam) ? sortParam : "relevance",
    view: viewParam && VALID_VIEWS.includes(viewParam) ? viewParam : "grid",
    page: Math.max(1, parseNumber(params.get("page")) ?? 1),
  };
}

export function filtersToSearchParams(
  filters: CategoryFilters,
  base?: URLSearchParams
): URLSearchParams {
  const params = new URLSearchParams(base?.toString() ?? "");

  const setOrDelete = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  setOrDelete("brand", filters.brands.length ? filters.brands.join(",") : null);
  setOrDelete(
    "minPrice",
    filters.minPrice !== null ? String(filters.minPrice) : null
  );
  setOrDelete(
    "maxPrice",
    filters.maxPrice !== null ? String(filters.maxPrice) : null
  );
  setOrDelete(
    "rating",
    filters.rating !== null ? String(filters.rating) : null
  );
  setOrDelete(
    "availability",
    filters.availability !== "all" ? filters.availability : null
  );
  setOrDelete(
    "condition",
    filters.conditions.length ? filters.conditions.join(",") : null
  );
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
  let count = filters.brands.length + filters.conditions.length;
  if (filters.minPrice !== null) count += 1;
  if (filters.maxPrice !== null) count += 1;
  if (filters.rating !== null) count += 1;
  if (filters.availability !== "all") count += 1;
  return count;
}

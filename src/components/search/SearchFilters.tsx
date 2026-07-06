"use client";

import { searchStore, useSearchStore } from "@/store/searchStore";
import type { SearchBrand, SearchCategory } from "@/types/search";

interface SearchFiltersProps {
  categories?: SearchCategory[];
  brands?: SearchBrand[];
  className?: string;
}

export default function SearchFilters({
  categories = [],
  brands = [],
  className = "",
}: SearchFiltersProps) {
  const filters = useSearchStore((s) => s.filters);

  return (
    <aside className={`sw-search-filters${className ? ` ${className}` : ""}`} aria-label="Search filters">
      <h3>Filter Results</h3>

      <label htmlFor="search-filter-category">
        Category
        <select
          id="search-filter-category"
          value={filters.category}
          onChange={(event) =>
            searchStore.setFilters({ category: event.target.value })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="search-filter-brand">
        Brand
        <select
          id="search-filter-brand"
          value={filters.brand}
          onChange={(event) =>
            searchStore.setFilters({ brand: event.target.value })
          }
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="search-filter-sort">
        Sort by
        <select
          id="search-filter-sort"
          value={filters.sort}
          onChange={(event) =>
            searchStore.setFilters({
              sort: event.target.value as
                | "relevance"
                | "price-asc"
                | "price-desc",
            })
          }
        >
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </label>

      <button
        type="button"
        className="sw-search-recent__clear"
        onClick={() => searchStore.resetFilters()}
      >
        Reset filters
      </button>
    </aside>
  );
}

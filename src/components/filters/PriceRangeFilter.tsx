"use client";

import { formatCurrency } from "@/utils/currency";
import FilterSection from "./FilterSection";

interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  rangeMin: number;
  rangeMax: number;
  onChange: (min: number | null, max: number | null) => void;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  rangeMin,
  rangeMax,
  onChange,
}: PriceRangeFilterProps) {
  return (
    <FilterSection title="Price Range">
      <div className="cat-filter-price">
        <div className="cat-filter-price__field">
          <label htmlFor="cat-filter-price-min">Min</label>
          <input
            id="cat-filter-price-min"
            type="number"
            min={rangeMin}
            max={rangeMax}
            placeholder={rangeMax > rangeMin ? formatCurrency(rangeMin) : "Min"}
            value={minPrice ?? ""}
            onChange={(e) =>
              onChange(
                e.target.value ? Number(e.target.value) : null,
                maxPrice
              )
            }
            aria-label="Minimum price"
          />
        </div>
        <div className="cat-filter-price__field">
          <label htmlFor="cat-filter-price-max">Max</label>
          <input
            id="cat-filter-price-max"
            type="number"
            min={rangeMin}
            max={rangeMax || undefined}
            placeholder={rangeMax > rangeMin ? formatCurrency(rangeMax) : "Max"}
            value={maxPrice ?? ""}
            onChange={(e) =>
              onChange(
                minPrice,
                e.target.value ? Number(e.target.value) : null
              )
            }
            aria-label="Maximum price"
          />
        </div>
      </div>
    </FilterSection>
  );
}

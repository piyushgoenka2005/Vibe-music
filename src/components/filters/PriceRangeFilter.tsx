"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/currency";
import FilterSection from "./FilterSection";

interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  rangeMin: number;
  rangeMax: number;
  onChange: (min: number | null, max: number | null) => void;
}

function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  rangeMin,
  rangeMax,
  onChange,
}: PriceRangeFilterProps) {
  const externalKey = `${minPrice ?? ""}|${maxPrice ?? ""}`;
  const [localMin, setLocalMin] = useState(minPrice != null ? String(minPrice) : "");
  const [localMax, setLocalMax] = useState(maxPrice != null ? String(maxPrice) : "");
  const [syncKey, setSyncKey] = useState(externalKey);

  if (externalKey !== syncKey) {
    setSyncKey(externalKey);
    setLocalMin(minPrice != null ? String(minPrice) : "");
    setLocalMax(maxPrice != null ? String(maxPrice) : "");
  }

  const commit = (nextMin: string, nextMax: string) => {
    onChange(parsePriceInput(nextMin), parsePriceInput(nextMax));
  };

  const hasRange = rangeMax > rangeMin;

  return (
    <FilterSection title="Price Range">
      <div className="cat-filter-price">
        <div className="cat-filter-price__field">
          <label htmlFor="cat-filter-price-min">Min</label>
          <input
            id="cat-filter-price-min"
            type="number"
            min={0}
            max={hasRange ? rangeMax : undefined}
            placeholder={hasRange ? formatCurrency(rangeMin) : "₹0"}
            value={localMin}
            onChange={(event) => {
              const value = event.target.value;
              setLocalMin(value);
              commit(value, localMax);
            }}
            aria-label="Minimum price"
          />
        </div>
        <div className="cat-filter-price__field">
          <label htmlFor="cat-filter-price-max">Max</label>
          <input
            id="cat-filter-price-max"
            type="number"
            min={0}
            max={hasRange ? rangeMax : undefined}
            placeholder={hasRange ? formatCurrency(rangeMax) : "Any"}
            value={localMax}
            onChange={(event) => {
              const value = event.target.value;
              setLocalMax(value);
              commit(localMin, value);
            }}
            aria-label="Maximum price"
          />
        </div>
      </div>
    </FilterSection>
  );
}

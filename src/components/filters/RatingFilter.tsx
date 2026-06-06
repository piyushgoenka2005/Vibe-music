"use client";

import FilterSection from "./FilterSection";

const RATINGS = [4, 3, 2, 1] as const;

interface RatingFilterProps {
  selected: number | null;
  onChange: (rating: number | null) => void;
}

export default function RatingFilter({ selected, onChange }: RatingFilterProps) {
  return (
    <FilterSection title="Customer Rating">
      {RATINGS.map((rating) => (
        <label key={rating} className="cat-filter-option">
          <input
            type="radio"
            name="rating-filter"
            checked={selected === rating}
            onChange={() => onChange(rating)}
          />
          <span>{rating} stars &amp; up</span>
        </label>
      ))}
      {selected !== null ? (
        <button
          type="button"
          className="cat-filter-clear"
          onClick={() => onChange(null)}
        >
          Clear rating
        </button>
      ) : null}
    </FilterSection>
  );
}

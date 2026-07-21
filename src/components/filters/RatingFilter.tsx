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
      <div className="cat-filter-pills" role="radiogroup" aria-label="Customer rating">
        {RATINGS.map((rating) => {
          const active = selected === rating;
          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={active}
              className={`cat-filter-pill${active ? " cat-filter-pill--active" : ""}`}
              onClick={() => onChange(active ? null : rating)}
            >
              <span className="cat-filter-pill__stars" aria-hidden="true">
                {"★".repeat(rating)}
              </span>
              <span>& up</span>
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}

"use client";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  label?: string;
}

const SIZE_CLASS = {
  sm: "pdp-star-rating--sm",
  md: "pdp-star-rating--md",
  lg: "pdp-star-rating--lg",
} as const;

export default function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  label,
}: StarRatingProps) {
  return (
    <div
      className={`pdp-star-rating ${SIZE_CLASS[size]}${interactive ? " pdp-star-rating--interactive" : ""}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={label ?? `${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(value);
        return (
          <button
            key={starValue}
            type="button"
            className={`pdp-star-rating__star${filled ? " pdp-star-rating__star--filled" : ""}`}
            disabled={!interactive}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            onClick={() => interactive && onChange?.(starValue)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

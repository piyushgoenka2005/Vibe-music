"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";

interface ProductStickyBarProps {
  price: number;
  productName: string;
  inStock: boolean;
  onAddToCart: () => void;
  sentinelRef: React.RefObject<HTMLElement | null>;
}

export default function ProductStickyBar({
  price,
  productName,
  inStock,
  onAddToCart,
  sentinelRef,
}: ProductStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  if (!visible) return null;

  return (
    <div className="pdp-mobile-bar" role="region" aria-label="Add to cart">
      <div className="pdp-mobile-bar__price">
        <span className="pdp-mobile-bar__label">Price</span>
        <strong>{formatCurrency(price)}</strong>
      </div>
      <button
        type="button"
        className="pdp-mobile-bar__cta"
        disabled={!inStock}
        onClick={onAddToCart}
        aria-label={`Add ${productName} to cart`}
      >
        {inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    </div>
  );
}

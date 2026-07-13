"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDisplayPrice } from "@/utils/currency";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";

interface ProductStickyBarProps {
  price: number;
  productName: string;
  inStock: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  sentinelRef: React.RefObject<HTMLElement | null>;
}

export default function ProductStickyBar({
  price,
  productName,
  inStock,
  onAddToCart,
  onBuyNow,
  sentinelRef,
}: ProductStickyBarProps) {
  const isMobile = useIsMobileViewport();
  const isClient = useIsClient();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  if (!isMobile || !isClient) return null;

  return createPortal(
    <div
      className={`pdp-mobile-bar${visible ? " pdp-mobile-bar--visible" : ""}`}
      role="region"
      aria-label="Quick purchase"
      aria-hidden={!visible}
    >
      <div className="pdp-mobile-bar__price">
        <span className="pdp-mobile-bar__label">
          {inStock ? "Price" : "Unavailable"}
        </span>
        <strong>{formatDisplayPrice(price)}</strong>
      </div>
      <div className="pdp-mobile-bar__actions">
        <button
          type="button"
          className="pdp-mobile-bar__cta pdp-mobile-bar__cta--cart"
          disabled={!inStock}
          onClick={onAddToCart}
          aria-label={`Add ${productName} to cart`}
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        <button
          type="button"
          className="pdp-mobile-bar__cta pdp-mobile-bar__cta--buy"
          disabled={!inStock}
          onClick={onBuyNow}
          aria-label={`Buy ${productName} now`}
        >
          Buy Now
        </button>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { useIsClient } from "@/hooks/useIsClient";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import NotifyMeButton from "./NotifyMeButton";

interface ProductStickyBarProps {
  price: number;
  productId: string;
  productSlug: string;
  productName: string;
  inStock: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  sentinelRef: React.RefObject<HTMLElement | null>;
}

export default function ProductStickyBar({
  price,
  productId,
  productSlug,
  productName,
  inStock,
  onAddToCart,
  onBuyNow,
  sentinelRef,
}: ProductStickyBarProps) {
  const isMobile = useIsMobileViewport();
  const isClient = useIsClient();
  const [visible, setVisible] = useState(false);
  const canPurchase = inStock && isPurchasablePrice(price);
  const isComingSoon = !isPurchasablePrice(price);

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
          {isComingSoon ? "Price" : canPurchase ? "Price" : "Unavailable"}
        </span>
        <strong>{formatDisplayPrice(price)}</strong>
      </div>
      <div className="pdp-mobile-bar__actions">
        {isComingSoon ? (
          <NotifyMeButton
            variant="sticky"
            productId={productId}
            productSlug={productSlug}
            productName={productName}
          />
        ) : (
          <>
            <button
              type="button"
              className="pdp-mobile-bar__cta pdp-mobile-bar__cta--cart"
              disabled={!canPurchase}
              onClick={onAddToCart}
              aria-label={`Add ${productName} to cart`}
            >
              {canPurchase ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              type="button"
              className="pdp-mobile-bar__cta pdp-mobile-bar__cta--buy"
              disabled={!canPurchase}
              onClick={onBuyNow}
              aria-label={`Buy ${productName} now`}
            >
              Buy Now
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

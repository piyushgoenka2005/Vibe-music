"use client";

import { lazy, Suspense, useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { useIsClient } from "@/hooks/useIsClient";

const NotifyMeButton = lazy(() => import("./NotifyMeButton"));

interface ProductStickyBarProps {
  price: number;
  productId: string;
  productSlug: string;
  productName: string;
  inStock: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  sentinelRef: RefObject<HTMLElement | null>;
}

function sentinelInView(sentinel: HTMLElement): boolean {
  const rect = sentinel.getBoundingClientRect();
  const viewportBottom = window.innerHeight - 24;
  return rect.top < viewportBottom && rect.bottom > 0;
}

function CartIcon() {
  return (
    <svg
      className="pdp-mobile-bar__cta-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      className="pdp-mobile-bar__cta-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
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
  const isClient = useIsClient();
  const [visible, setVisible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const canPurchase = inStock && isPurchasablePrice(price);
  const isComingSoon = !isPurchasablePrice(price);
  const priceLabel = useMemo(() => formatDisplayPrice(price), [price]);
  const showNotify = isComingSoon || !inStock;

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const syncVisibility = () => {
      setVisible(!sentinelInView(sentinel));
    };

    syncVisibility();

    const sentinelObserver = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );

    sentinelObserver.observe(sentinel);

    const footer = document.querySelector<HTMLElement>(
      ".site-footer__shell, .site-footer-newsletter, .site-footer",
    );

    let footerObserver: IntersectionObserver | undefined;
    if (footer) {
      footerObserver = new IntersectionObserver(
        ([entry]) => {
          setFooterInView(Boolean(entry?.isIntersecting));
        },
        { root: null, threshold: 0, rootMargin: "0px 0px -8% 0px" },
      );
      footerObserver.observe(footer);
    }

    return () => {
      sentinelObserver.disconnect();
      footerObserver?.disconnect();
    };
  }, [sentinelRef]);

  const showBar = visible && !footerInView;

  useLayoutEffect(() => {
    if (!isClient) return;
    document.body.classList.toggle("pdp-mobile-bar-active", showBar);
    return () => document.body.classList.remove("pdp-mobile-bar-active");
  }, [isClient, showBar]);

  if (!isClient) return null;

  return createPortal(
    <div
      className={`pdp-mobile-bar${showBar ? " pdp-mobile-bar--visible" : ""}`}
      role="region"
      aria-label="Quick purchase"
      aria-hidden={!showBar}
    >
      <div className="pdp-mobile-bar__price">
        <span className="pdp-mobile-bar__label">
          {isComingSoon ? "Status" : canPurchase ? "Price" : "Unavailable"}
        </span>
        <strong>{priceLabel}</strong>
      </div>
      <div className="pdp-mobile-bar__actions">
        {showNotify ? (
          <Suspense
            fallback={
              <button type="button" className="pdp-mobile-bar__cta pdp-mobile-bar__cta--notify">
                Notify Me
              </button>
            }
          >
            <NotifyMeButton
              variant="inline"
              productId={productId}
              productSlug={productSlug}
              productName={productName}
              className="pdp-mobile-bar__cta pdp-mobile-bar__cta--notify"
            />
          </Suspense>
        ) : (
          <>
            <button
              type="button"
              className="pdp-mobile-bar__cta pdp-mobile-bar__cta--cart"
              disabled={!canPurchase}
              onClick={onAddToCart}
              aria-label={`Add ${productName} to cart`}
            >
              {canPurchase ? (
                <>
                  <CartIcon />
                  <span className="pdp-mobile-bar__cta-label">Add to Cart</span>
                </>
              ) : (
                "Out of Stock"
              )}
            </button>
            <button
              type="button"
              className="pdp-mobile-bar__cta pdp-mobile-bar__cta--buy"
              disabled={!canPurchase}
              onClick={onBuyNow}
              aria-label={`Buy ${productName} now`}
            >
              <BagIcon />
              <span className="pdp-mobile-bar__cta-label">Buy Now</span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

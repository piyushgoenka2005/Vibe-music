"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, X } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { useCartCatalogReprice } from "@/hooks/useCartCatalogReprice";
import { useCartPromotions } from "@/hooks/useCartPromotions";
import { fetchProductSummaries, fetchProducts } from "@/services/products.api";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import CartEmptyState from "./CartEmptyState";
import CartItem from "./CartItem";
import CartMilestoneProgress from "./CartMilestoneProgress";
import CartPromoBanner from "./CartPromoBanner";
import CartSavingsSummary from "./CartSavingsSummary";
import CartStickyFooter from "./CartStickyFooter";
import CartUpsellCarousel from "./CartUpsellCarousel";

export type CartShellVariant = "drawer" | "page";

interface CartShellProps {
  variant: CartShellVariant;
  onClose?: () => void;
  onBrowse?: () => void;
}

export default function CartShell({
  variant,
  onClose,
  onBrowse,
}: CartShellProps) {
  const isClient = useIsClient();
  const items = useCartStore((s) => s.items);
  const isUpdating = useCartStore((s) => s.isUpdating);
  const itemCount = useCartStore((s) => s.itemCount());
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);

  const repriceEnabled = variant === "drawer" ? true : isClient;
  useCartCatalogReprice(repriceEnabled);
  useCartPromotions(isClient);

  const recentlyViewedKey = useMemo(
    () => recentlyViewedIds.slice(0, 12).join(","),
    [recentlyViewedIds]
  );

  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ["cart-recently-viewed", recentlyViewedKey],
    queryFn: () => fetchProductSummaries(recentlyViewedIds.slice(0, 12)),
    enabled: isClient && recentlyViewedIds.length > 0,
    staleTime: 60_000,
  });

  const cartProductIds = useMemo(
    () =>
      new Set(
        items.filter((item) => !item.isPromoGift).map((item) => item.productId)
      ),
    [items]
  );

  const { data: recommended = [] } = useQuery({
    queryKey: ["cart-recommended", [...cartProductIds].join(",")],
    queryFn: () => fetchProducts({ limit: 12, trending: true }),
    enabled: isClient && items.length > 0,
    staleTime: 120_000,
  });

  const upsellProducts = useMemo(() => {
    const merged = [...recentlyViewed, ...recommended];
    const seen = new Set<string>();
    return merged.filter((product) => {
      if (seen.has(product.id) || cartProductIds.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [recentlyViewed, recommended, cartProductIds]);

  const paidItems = useMemo(
    () => items.filter((item) => !item.isPromoGift),
    [items]
  );
  const giftItems = useMemo(
    () => items.filter((item) => item.isPromoGift),
    [items]
  );

  if (!isClient) {
    return (
      <div className="cart-shell cart-shell--loading" aria-busy="true">
        <div className="cart-skeleton-line" />
        <div className="cart-skeleton-line" />
        <div className="cart-skeleton-line" />
      </div>
    );
  }

  const titleId = variant === "drawer" ? "cart-drawer-title" : undefined;

  return (
    <div className={`cart-shell cart-shell--${variant}`}>
      <header className="cart-shell__header">
        {variant === "drawer" ? (
          <>
            <div className="cart-shell__header-top">
              <button
                type="button"
                className="cart-shell__back"
                onClick={onClose}
                aria-label="Continue shopping"
              >
                <ChevronLeft size={20} strokeWidth={2} aria-hidden />
                <span className="cart-shell__back-label">Continue Shopping</span>
              </button>
              <button
                type="button"
                className="cart-shell__close"
                onClick={onClose}
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>
            <div className="cart-shell__heading">
              <h2 id={titleId} className="cart-shell__title">
                Cart
              </h2>
              <p className="cart-shell__subtitle">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </>
        ) : (
          <div className="cart-shell__heading">
            <h1 id={titleId} className="cart-shell__title">
              Cart
            </h1>
            {items.length > 0 ? (
              <p className="cart-shell__subtitle">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            ) : (
              <p className="cart-shell__subtitle">Empty</p>
            )}
          </div>
        )}
      </header>

      <div className="cart-shell__body">
        {isUpdating ? (
          <div className="cart-loading" role="status" aria-live="polite">
            <div className="cart-spinner" aria-hidden="true" />
            Updating cart...
          </div>
        ) : null}

        {items.length === 0 ? (
          <CartEmptyState onBrowse={onBrowse ?? onClose} />
        ) : (
          <>
            <div className="cart-shell__context">
              <CartPromoBanner />
              <CartMilestoneProgress />
            </div>

            {paidItems.length > 0 ? (
              <div className="cart-shell__items" aria-label="Cart items">
                {paidItems.map((item) => (
                  <CartItem
                    key={item.lineId}
                    item={item}
                    compact={variant === "drawer"}
                  />
                ))}
              </div>
            ) : null}

            {giftItems.length > 0 ? (
              <section className="cart-shell__gifts" aria-label="Unlocked rewards">
                <h2 className="cart-shell__gifts-title">Complimentary reward</h2>
                <p className="cart-shell__gifts-note">
                  Included with your purchase — unlocked by your order value.
                </p>
                <div className="cart-shell__items">
                  {giftItems.map((item) => (
                    <CartItem
                      key={item.lineId}
                      item={item}
                      compact={variant === "drawer"}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <CartSavingsSummary />

            <CartUpsellCarousel
              products={upsellProducts}
              title="Recommended for you"
            />
          </>
        )}
      </div>

      <CartStickyFooter
        showViewCartLink={variant === "drawer"}
        onContinueShopping={onBrowse ?? onClose}
      />
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { formatCurrency, formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import type { ResolvedProductBundle } from "@/types/bundle";
import type { Product, ProductDetail, ProductVariant } from "@/types/product";

interface FrequentlyBoughtTogetherProps {
  mainProduct: ProductDetail;
  mainVariant?: ProductVariant;
  bundle: ResolvedProductBundle;
}

export default function FrequentlyBoughtTogether({
  mainProduct,
  mainVariant,
  bundle,
}: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const purchasableExtras = bundle.items.filter((p) =>
    isPurchasablePrice(p.price)
  );

  const mainLine: Product = {
    ...mainProduct,
    price: mainVariant?.price ?? mainProduct.price,
    image: mainVariant?.images?.[0] || mainProduct.image,
  };

  const allProducts = useMemo(
    () => [mainLine, ...purchasableExtras],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mainLine.id, purchasableExtras.map((p) => p.id).join(",")]
  );

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    allProducts.forEach((p) => (init[p.id] = true));
    return init;
  });

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    allProducts.forEach((p) => (init[p.id] = 1));
    return init;
  });

  if (
    purchasableExtras.length === 0 ||
    !isPurchasablePrice(mainLine.price)
  ) {
    return null;
  }

  const toggleItem = (id: string) => {
    if (id === mainLine.id) return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  };

  const selectedProducts = allProducts.filter((p) => selected[p.id]);
  const selectedCount = selectedProducts.length;

  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * (quantities[p.id] ?? 1),
    0
  );
  const bundlePrice =
    Math.round(subtotal * (1 - bundle.discountPercent / 100) * 100) / 100;
  const savings = Math.round((subtotal - bundlePrice) * 100) / 100;

  function addBundle() {
    selectedProducts.forEach((p) => {
      const qty = quantities[p.id] ?? 1;
      if (p.id === mainLine.id) {
        addItem(mainLine, qty, mainVariant);
      } else {
        addItem(p, qty);
      }
    });
    openDrawer();
  }

  return (
    <section className="pdp-section" aria-label="Complete your order">
      <h2 className="pdp-section__title">Complete Your Order</h2>
      <div className="pdp-fbt">
        <div className="pdp-fbt__products">
          {allProducts.map((product, index) => {
            const isMain = product.id === mainLine.id;
            const isChecked = selected[product.id];
            const qty = quantities[product.id] ?? 1;

            return (
              <div key={product.id} className="pdp-fbt__product-group">
                {index > 0 && (
                  <span className="pdp-fbt__plus" aria-hidden="true">
                    +
                  </span>
                )}
                <div
                  className={`pdp-fbt__card${isChecked ? " pdp-fbt__card--selected" : ""}${isMain ? " pdp-fbt__card--main" : ""}`}
                >
                  {!isMain && (
                    <label className="pdp-fbt__checkbox-wrap">
                      <input
                        type="checkbox"
                        className="pdp-fbt__checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(product.id)}
                        aria-label={`Include ${product.name}`}
                      />
                      <span className="pdp-fbt__checkmark" />
                    </label>
                  )}
                  <Link
                    href={`/product/${product.slug}`}
                    className="pdp-fbt__card-link"
                  >
                    <div className="pdp-fbt__image-wrap">
                      {product.image ? (
                        <StorefrontThumbImage
                          src={product.image}
                          alt={product.name}
                          className="pdp-fbt__image"
                          width={240}
                          height={240}
                          preferOriginal
                        />
                      ) : (
                        <div
                          className="pdp-fbt__image-placeholder"
                          style={{ backgroundColor: product.imageColor }}
                        />
                      )}
                    </div>
                  </Link>
                  <div className="pdp-fbt__card-info">
                    <span className="pdp-fbt__brand">{product.brand}</span>
                    <h3 className="pdp-fbt__name" title={product.name}>
                      {product.name}
                    </h3>
                    <span className="pdp-fbt__price">
                      {formatDisplayPrice(product.price)}
                    </span>
                    {!isMain && isChecked && (
                      <div className="pdp-fbt__qty-row">
                        <span className="pdp-fbt__qty-label">qty</span>
                        <div className="pdp-fbt__qty-control">
                          <button
                            type="button"
                            className="pdp-fbt__qty-btn"
                            onClick={() => updateQty(product.id, -1)}
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="pdp-fbt__qty-value">{qty}</span>
                          <button
                            type="button"
                            className="pdp-fbt__qty-btn"
                            onClick={() => updateQty(product.id, 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {savings > 0 && (
            <>
              <span className="pdp-fbt__plus" aria-hidden="true">
                =
              </span>
              <div className="pdp-fbt__savings-badge">
                <span className="pdp-fbt__savings-amount">
                  {formatCurrency(savings)}
                </span>
                <span className="pdp-fbt__savings-label">Bundle<br />Savings</span>
              </div>
            </>
          )}
        </div>

        <div className="pdp-fbt__summary">
          <div className="pdp-fbt__summary-pricing">
            <span className="pdp-fbt__summary-label">
              Buy all {selectedCount}:
            </span>
            {savings > 0 && (
              <span className="pdp-fbt__summary-original">
                {formatCurrency(subtotal)}
              </span>
            )}
            <span className="pdp-fbt__summary-total">
              {formatCurrency(bundlePrice)}
            </span>
          </div>
          <button
            type="button"
            className="pdp-btn pdp-btn--primary pdp-fbt__add-all"
            onClick={addBundle}
            disabled={selectedCount === 0}
          >
            Add All {selectedCount} to Cart
          </button>
          <span className="pdp-fbt__divider-text">OR</span>
          <Link
            href="/category/accessories"
            className="pdp-btn pdp-btn--secondary pdp-fbt__build-own"
          >
            Build Your Own Bundle and Save
          </Link>
        </div>
      </div>
    </section>
  );
}

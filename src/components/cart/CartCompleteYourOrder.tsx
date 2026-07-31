"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { categoryPath, productPath } from "@/lib/routes";
import { fetchProductDetail } from "@/services/product.service";
import { useCartStore, type CartItem } from "@/store/cartStore";
import { DEFAULT_BUNDLE_DISCOUNT_PERCENT } from "@/types/bundle";
import type { Product } from "@/types/product";
import {
  formatCurrency,
  formatDisplayPrice,
  isPurchasablePrice,
} from "@/utils/currency";

interface CartCompleteYourOrderProps {
  primaryItem: CartItem;
}

function cartItemAsProduct(item: CartItem): Product {
  return {
    id: item.productId,
    slug: item.slug?.trim() || item.productId,
    name: item.name,
    brand: item.brand,
    brandSlug: "",
    category: "",
    categorySlug: "",
    price: item.price,
    originalPrice: item.originalPrice,
    gstRate: item.gstRate,
    rating: 0,
    reviewCount: 0,
    availability: "in-stock",
    condition: "new",
    imageColor: item.imageColor ?? "#f2f1f0",
    image: item.image ?? "",
  };
}

export default function CartCompleteYourOrder({
  primaryItem,
}: CartCompleteYourOrderProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const slug = primaryItem.slug?.trim() || "";

  const cartProductIds = useMemo(
    () =>
      new Set(
        cartItems
          .filter((item) => !item.isPromoGift)
          .map((item) => item.productId)
      ),
    [cartItems]
  );

  const { data } = useQuery({
    queryKey: ["cart-complete-your-order", slug],
    queryFn: () => fetchProductDetail(slug),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });

  const mainProduct = useMemo(() => {
    if (data?.product) {
      return {
        ...data.product,
        price: primaryItem.price,
        image: primaryItem.image || data.product.image,
      } satisfies Product;
    }
    return cartItemAsProduct(primaryItem);
  }, [data, primaryItem]);

  const extras = useMemo(() => {
    const fromBundle = data?.bundle?.items ?? [];
    const fromRelated = data?.relatedProducts ?? [];
    const merged = [...fromBundle, ...fromRelated];
    const seen = new Set<string>([mainProduct.id]);
    return merged.filter((product) => {
      if (
        seen.has(product.id) ||
        cartProductIds.has(product.id) ||
        !product.slug?.trim() ||
        !isPurchasablePrice(product.price)
      ) {
        return false;
      }
      seen.add(product.id);
      return true;
    }).slice(0, 3);
  }, [data?.bundle?.items, data?.relatedProducts, cartProductIds, mainProduct.id]);

  const discountPercent =
    data?.bundle?.discountPercent ?? DEFAULT_BUNDLE_DISCOUNT_PERCENT;

  const allProducts = useMemo(
    () => [mainProduct, ...extras],
    [mainProduct, extras]
  );

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const selectedMap = useMemo(() => {
    const next: Record<string, boolean> = { [mainProduct.id]: true };
    for (const product of extras) {
      next[product.id] =
        selected[product.id] ?? true;
    }
    return next;
  }, [mainProduct.id, extras, selected]);

  const quantityMap = useMemo(() => {
    const next: Record<string, number> = { [mainProduct.id]: 1 };
    for (const product of extras) {
      next[product.id] = quantities[product.id] ?? 1;
    }
    return next;
  }, [mainProduct.id, extras, quantities]);

  if (extras.length === 0 || !isPurchasablePrice(mainProduct.price)) {
    return null;
  }

  const toggleItem = (id: string) => {
    if (id === mainProduct.id) return;
    setSelected((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  };

  const selectedProducts = allProducts.filter((p) => selectedMap[p.id]);
  const selectedExtras = selectedProducts.filter((p) => p.id !== mainProduct.id);
  const selectedCount = selectedProducts.length;

  const subtotal = selectedProducts.reduce(
    (sum, p) => sum + p.price * (quantityMap[p.id] ?? 1),
    0
  );
  const bundlePrice =
    Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100;
  const savings = Math.round((subtotal - bundlePrice) * 100) / 100;

  function addBundle() {
    const multiplier = 1 - discountPercent / 100;
    selectedExtras.forEach((product) => {
      const qty = quantityMap[product.id] ?? 1;
      const unitPrice = Math.round(product.price * multiplier * 100) / 100;
      addItem(
        {
          ...product,
          price: unitPrice,
          originalPrice: product.price,
        },
        qty
      );
    });
  }

  return (
    <section
      className="cart-complete-order"
      aria-label="Complete your order"
    >
      <h2 className="cart-complete-order__title">Complete Your Order</h2>
      <div className="cart-fbt">
        <div className="cart-fbt__products">
          {allProducts.map((product, index) => {
            const isMain = product.id === mainProduct.id;
            const isChecked = selectedMap[product.id];
            const qty = quantityMap[product.id] ?? 1;

            return (
              <div key={product.id} className="cart-fbt__product-group">
                {index > 0 ? (
                  <span className="cart-fbt__plus" aria-hidden="true">
                    +
                  </span>
                ) : null}
                <div
                  className={`cart-fbt__card${isChecked ? " cart-fbt__card--selected" : ""}${isMain ? " cart-fbt__card--main" : ""}`}
                >
                  {!isMain ? (
                    <label className="cart-fbt__checkbox-wrap">
                      <input
                        type="checkbox"
                        className="cart-fbt__checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(product.id)}
                        aria-label={`Include ${product.name}`}
                      />
                      <span className="cart-fbt__checkmark" />
                    </label>
                  ) : null}
                  <Link
                    href={productPath(product.slug)}
                    className="cart-fbt__card-link"
                  >
                    <div className="cart-fbt__image-wrap">
                      {product.image ? (
                        <StorefrontThumbImage
                          src={product.image}
                          alt={product.name}
                          className="cart-fbt__image"
                          width={240}
                          height={240}
                          preferOriginal
                        />
                      ) : (
                        <div
                          className="cart-fbt__image-placeholder"
                          style={{ backgroundColor: product.imageColor }}
                        />
                      )}
                    </div>
                  </Link>
                  <div className="cart-fbt__card-info">
                    <span className="cart-fbt__brand">{product.brand}</span>
                    <h3 className="cart-fbt__name" title={product.name}>
                      {product.name}
                    </h3>
                    <span className="cart-fbt__price">
                      {formatDisplayPrice(product.price)}
                    </span>
                    {!isMain && isChecked ? (
                      <div className="cart-fbt__qty-row">
                        <span className="cart-fbt__qty-label">qty</span>
                        <div className="cart-fbt__qty-control">
                          <button
                            type="button"
                            className="cart-fbt__qty-btn"
                            onClick={() => updateQty(product.id, -1)}
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="cart-fbt__qty-value">{qty}</span>
                          <button
                            type="button"
                            className="cart-fbt__qty-btn"
                            onClick={() => updateQty(product.id, 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {savings > 0 ? (
            <>
              <span className="cart-fbt__plus" aria-hidden="true">
                =
              </span>
              <div className="cart-fbt__savings-badge">
                <span className="cart-fbt__savings-amount">
                  {formatCurrency(savings)}
                </span>
                <span className="cart-fbt__savings-label">
                  Bundle
                  <br />
                  Savings
                </span>
              </div>
            </>
          ) : null}
        </div>

        <div className="cart-fbt__summary">
          <div className="cart-fbt__summary-pricing">
            <span className="cart-fbt__summary-label">
              Buy all {selectedCount}:
            </span>
            {savings > 0 ? (
              <span className="cart-fbt__summary-original">
                {formatCurrency(subtotal)}
              </span>
            ) : null}
            <span className="cart-fbt__summary-total">
              {formatCurrency(bundlePrice)}
            </span>
          </div>
          <button
            type="button"
            className="cart-fbt__add-all"
            onClick={addBundle}
            disabled={selectedExtras.length === 0}
          >
            {selectedExtras.length === 0
              ? "Select add-ons"
              : `Add ${selectedExtras.length} to Cart`}
          </button>
          <span className="cart-fbt__divider-text">OR</span>
          <Link
            href={categoryPath("cables-cases-accessories")}
            className="cart-fbt__build-own"
          >
            Build Your Own Bundle and Save
          </Link>
        </div>
      </div>
    </section>
  );
}

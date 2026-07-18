"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import type { Product } from "@/types/product";
import { formatDisplayPrice } from "@/utils/currency";

interface ProductRelatedRailProps {
  products: Product[];
  onDismiss: (productId: string) => void;
}

export default function ProductRelatedRail({
  products,
  onDismiss,
}: ProductRelatedRailProps) {
  if (products.length === 0) return null;

  return (
    <aside className="pdp-related-rail" aria-label="Suggested related products">
      <div className="pdp-related-rail__card">
        <div className="pdp-related-rail__header">
          <span className="pdp-related-rail__eyebrow">You may also like</span>
          <h2 className="pdp-related-rail__title">Related products</h2>
        </div>

        <div className="pdp-related-rail__list">
          {products.map((item) => (
            <div key={item.id} className="pdp-related-rail__item">
              <button
                type="button"
                className="pdp-related-rail__dismiss"
                aria-label={`Dismiss ${item.name}`}
                onClick={() => onDismiss(item.id)}
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>

              <Link
                href={`/product/${item.slug}`}
                className="pdp-related-rail__link"
              >
                <span className="pdp-related-rail__media">
                  {item.image ? (
                    <StorefrontThumbImage
                      src={item.image}
                      alt={item.name}
                      className="pdp-related-rail__image"
                      width={220}
                      height={220}
                      preferOriginal
                    />
                  ) : (
                    <span
                      className="pdp-related-rail__swatch"
                      style={{ backgroundColor: item.imageColor }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="pdp-related-rail__body">
                  <span className="pdp-related-rail__brand">{item.brand}</span>
                  <span className="pdp-related-rail__name">{item.name}</span>
                  {item.rating > 0 ? (
                    <span className="pdp-related-rail__rating">
                      <Star size={11} fill="currentColor" aria-hidden="true" />
                      {item.rating.toFixed(1)}
                    </span>
                  ) : null}
                  <strong className="pdp-related-rail__price">
                    {formatDisplayPrice(item.price)}
                  </strong>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

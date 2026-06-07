"use client";

import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import type { Product, ProductDetail } from "@/types/product";

interface FrequentlyBoughtTogetherProps {
  mainProduct: ProductDetail;
  products: Product[];
}

export default function FrequentlyBoughtTogether({
  mainProduct,
  products,
}: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((s) => s.addItem);

  if (products.length === 0) return null;

  const bundle = [mainProduct, ...products];
  const total = bundle.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = Math.round(total * 0.92 * 100) / 100;

  function addBundle() {
    bundle.forEach((p) => addItem(p, 1));
  }

  return (
    <section className="pdp-section" aria-label="Frequently bought together">
      <h2 className="pdp-section__title">Frequently Bought Together</h2>
      <div className="pdp-fbt">
        <div className="pdp-fbt__items">
          {bundle.map((product, index) => (
            <span key={product.id} style={{ display: "contents" }}>
              {index > 0 ? (
                <span className="pdp-fbt__plus" aria-hidden="true">
                  +
                </span>
              ) : null}
              <Link
                href={`/product/${product.slug}`}
                className="pdp-cross-sell__card"
                style={{ width: 160 }}
              >
                <div
                  className="pdp-cross-sell__swatch"
                  style={{ backgroundColor: product.imageColor }}
                />
                <div className="pdp-cross-sell__brand">{product.brand}</div>
                <div className="pdp-cross-sell__name">{product.name}</div>
                <div className="pdp-cross-sell__price">
                  {formatCurrency(product.price)}
                </div>
              </Link>
            </span>
          ))}
        </div>
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#807f7e" }}>
            Bundle price:{" "}
            <strong style={{ color: "#0072ba", fontSize: 20 }}>
              {formatCurrency(bundlePrice)}
            </strong>
          </p>
          <button type="button" className="pdp-btn pdp-btn--primary" onClick={addBundle}>
            Add Bundle to Cart
          </button>
        </div>
      </div>
    </section>
  );
}

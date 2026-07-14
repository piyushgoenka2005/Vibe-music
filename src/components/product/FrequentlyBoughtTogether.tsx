"use client";

import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
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

  const purchasableExtras = bundle.items.filter((product) =>
    isPurchasablePrice(product.price)
  );

  const mainLine: Product = {
    ...mainProduct,
    price: mainVariant?.price ?? mainProduct.price,
    image: mainVariant?.images?.[0] || mainProduct.image,
  };

  if (
    purchasableExtras.length === 0 ||
    !isPurchasablePrice(mainLine.price)
  ) {
    return null;
  }

  const bundleProducts = [mainLine, ...purchasableExtras];
  const subtotal = bundleProducts.reduce((sum, product) => sum + product.price, 0);
  const bundlePrice =
    Math.round(subtotal * (1 - bundle.discountPercent / 100) * 100) / 100;
  const savings = Math.round((subtotal - bundlePrice) * 100) / 100;

  function addBundle() {
    addItem(mainLine, 1, mainVariant);
    purchasableExtras.forEach((product) => addItem(product, 1));
  }

  return (
    <section className="pdp-section" aria-label="Frequently bought together">
      <h2 className="pdp-section__title">Frequently Bought Together</h2>
      <div className="pdp-fbt">
        <div className="pdp-fbt__items">
          {bundleProducts.map((product, index) => (
            <span key={product.id} style={{ display: "contents" }}>
              {index > 0 ? (
                <span className="pdp-fbt__plus" aria-hidden="true">
                  +
                </span>
              ) : null}
              <div className="pdp-fbt__card-wrap">
                <ProductShareButton
                  overlay
                  position="top-right"
                  title={`${product.brand} ${product.name}`}
                  url={`/product/${product.slug}`}
                  size={16}
                />
                <Link
                href={`/product/${product.slug}`}
                className="pdp-cross-sell__card pdp-fbt__card"
              >
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
                    className="pdp-cross-sell__swatch"
                    style={{ backgroundColor: product.imageColor }}
                  />
                )}
                <div className="pdp-cross-sell__brand">{product.brand}</div>
                <div className="pdp-cross-sell__name">{product.name}</div>
                <div className="pdp-cross-sell__price">
                  {formatDisplayPrice(product.price)}
                </div>
              </Link>
              </div>
            </span>
          ))}
        </div>
        <div className="pdp-fbt__summary">
          <p className="pdp-fbt__subtotal">
            Separate price:{" "}
            <span className="pdp-fbt__subtotal-value">
              {formatCurrency(subtotal)}
            </span>
          </p>
          <p className="pdp-fbt__bundle-price">
            Bundle price ({bundle.discountPercent}% off):{" "}
            <strong>{formatCurrency(bundlePrice)}</strong>
          </p>
          {savings > 0 ? (
            <p className="pdp-fbt__savings">
              You save {formatCurrency(savings)}
            </p>
          ) : null}
          <button type="button" className="pdp-btn pdp-btn--primary" onClick={addBundle}>
            Add All to Cart
          </button>
        </div>
      </div>
    </section>
  );
}

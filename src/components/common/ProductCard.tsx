"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import ProductShareButton from "@/components/product/ProductShareButton";
import CompareButton from "@/components/compare/CompareButton";
import WishlistButton from "@/components/wishlist/WishlistButton";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import { formatCurrency, formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { optimizeImageUrl } from "@/lib/storefrontImages";
import type { Product } from "@/types/product";
import type { ViewMode } from "@/types/filters";

interface ProductCardProps {
  product: Product;
  view: ViewMode;
}

function availabilityLabel(availability: Product["availability"]): string {
  switch (availability) {
    case "in-stock":
      return "In Stock";
    case "limited":
      return "Limited";
    case "out-of-stock":
      return "Out of Stock";
  }
}

function availabilityClass(availability: Product["availability"]): string {
  switch (availability) {
    case "in-stock":
      return "cat-product-card__badge--stock";
    case "limited":
      return "cat-product-card__badge--limited";
    case "out-of-stock":
      return "cat-product-card__badge--oos";
  }
}

function conditionLabel(condition: Product["condition"]): string {
  switch (condition) {
    case "used":
      return "Pre-owned";
    case "open-box":
      return "Open box";
    default:
      return "New";
  }
}

function discountPercent(original: number, current: number): number {
  if (original <= 0 || current <= 0 || current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
}

export default function ProductCard({ product, view }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const productHref = `/product/${product.slug}`;

  function prefetchProduct() {
    try {
      router.prefetch(productHref);
    } catch {
      /* prefetch is best-effort */
    }
  }

  function handleAdd() {
    if (product.availability === "out-of-stock" || !isPurchasablePrice(product.price)) {
      return;
    }
    addItem(product);
    openDrawer();
  }

  const displayName = formatProductCardTitle(product.name, product.brand);
  const originalPrice = product.originalPrice ?? product.price;
  const hasDiscount = originalPrice > product.price && product.price > 0;
  const savingsPercent = discountPercent(originalPrice, product.price);
  const isComingSoon = !isPurchasablePrice(product.price);
  const canQuickAdd =
    product.availability !== "out-of-stock" && isPurchasablePrice(product.price);
  const isGrid = view === "grid";
  const preferredSrc = product.image
    ? optimizeImageUrl(product.image, "productCard")
    : "";
  const [imageSrc, setImageSrc] = useState(preferredSrc);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageSrc(preferredSrc);
    setImageFailed(false);
  }, [preferredSrc]);

  const imageUnoptimized =
    imageSrc.startsWith("http://") ||
    imageSrc.startsWith("https://") ||
    imageSrc.includes("/api/media/thumb");

  return (
    <article
      className="cat-product-card"
      data-view={view}
      aria-label={`${product.brand} ${product.name}`}
    >
      <div className="cat-product-card__media-wrap">
        <Link
          href={productHref}
          className="cat-product-card__image"
          aria-hidden="true"
          tabIndex={-1}
          prefetch
          onMouseEnter={prefetchProduct}
          onFocus={prefetchProduct}
        >
          {isGrid && savingsPercent > 0 ? (
            <span className="cat-product-card__deal-tag">{savingsPercent}% off</span>
          ) : null}
          {imageSrc && !imageFailed ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              loading="lazy"
              unoptimized={imageUnoptimized}
              className="cat-product-card__image-photo"
              onError={() => {
                // Never fall back to full CDN masters (often multi‑MB PNGs).
                setImageFailed(true);
              }}
            />
          ) : null}
        </Link>
        <div className="product-card-actions">
          <ProductShareButton
            title={`${product.brand} ${product.name}`}
            url={productHref}
          />
          <CompareButton product={product} />
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="cat-product-card__body">
        {isGrid ? (
          <>
            <div className="cat-product-card__brand cat-product-card__brand--desktop">
              {product.brand}
            </div>
            <span className="cat-product-card__category-pill">{product.category}</span>
          </>
        ) : (
          <div className="cat-product-card__brand">{product.brand}</div>
        )}
        <h3 className="cat-product-card__name">
          <Link
            href={productHref}
            prefetch
            title={product.name}
            onMouseEnter={prefetchProduct}
            onFocus={prefetchProduct}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {displayName}
          </Link>
        </h3>
        {isGrid ? (
          <p className="cat-product-card__descriptor">
            {conditionLabel(product.condition)} · {availabilityLabel(product.availability)}
          </p>
        ) : null}
        {product.reviewCount > 0 ? (
          <div className="cat-product-card__rating">
            <span className="cat-product-card__rating-stars" aria-hidden="true">
              ★
            </span>
            <span className="cat-product-card__rating-value">
              {product.rating.toFixed(1)}
            </span>
            <span className="cat-product-card__rating-count">
              | {product.reviewCount.toLocaleString("en-IN")}
            </span>
          </div>
        ) : null}
        {isGrid ? (
          <div className="cat-product-card__price-row">
            <span
              className={`cat-product-card__price cat-product-card__price--sale${
                product.price <= 0 ? " cat-product-card__price--enquiry" : ""
              }`}
            >
              {formatDisplayPrice(product.price)}
            </span>
            {hasDiscount ? (
              <>
                <span className="cat-product-card__price cat-product-card__price--was">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="cat-product-card__discount">{savingsPercent}% off</span>
              </>
            ) : null}
          </div>
        ) : (
          <div className="cat-product-card__meta">
            <div className="cat-product-card__pricing">
              {hasDiscount ? (
                <span className="cat-product-card__price cat-product-card__price--was">
                  {formatCurrency(originalPrice)}
                </span>
              ) : null}
              <span
                className={`cat-product-card__price cat-product-card__price--sale${
                  product.price <= 0 ? " cat-product-card__price--enquiry" : ""
                }`}
              >
                {formatDisplayPrice(product.price)}
              </span>
            </div>
            <span
              className={`cat-product-card__badge ${availabilityClass(product.availability)}`}
            >
              {availabilityLabel(product.availability)}
            </span>
          </div>
        )}
        {isComingSoon ? (
          <NotifyMeButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
          />
        ) : (
          <button
            type="button"
            className="cat-product-card__add"
            onClick={handleAdd}
            disabled={!canQuickAdd}
            aria-label={`Add ${product.name} to cart`}
          >
            {canQuickAdd ? "Add to cart" : "Out of stock"}
          </button>
        )}
      </div>
    </article>
  );
}

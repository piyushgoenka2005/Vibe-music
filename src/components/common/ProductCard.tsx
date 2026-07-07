"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import ProductShareButton from "@/components/product/ProductShareButton";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { formatCurrency } from "@/utils/currency";
import { optimizeImageUrl } from "@/lib/images";
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
    if (product.availability === "out-of-stock") return;
    addItem(product);
    openDrawer();
  }

  const displayName = formatProductCardTitle(product.name, product.brand);
  const originalPrice = product.originalPrice ?? product.price;
  const hasDiscount = originalPrice > product.price && product.price > 0;

  return (
    <article
      className="cat-product-card"
      data-view={view}
      aria-label={`${product.brand} ${product.name}`}
    >
      <div style={{ position: "relative" }}>
        <Link
          href={productHref}
          className="cat-product-card__image"
          aria-hidden="true"
          tabIndex={-1}
          prefetch
          onMouseEnter={prefetchProduct}
          onFocus={prefetchProduct}
        >
          <img
            src={optimizeImageUrl(product.image, "productCard")}
            alt=""
            className="cat-product-card__image-photo"
          />
        </Link>
        <div className="product-card-actions">
          <ProductShareButton
            title={`${product.brand} ${product.name}`}
            url={productHref}
          />
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="cat-product-card__body">
        <div className="cat-product-card__brand">{product.brand}</div>
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
        <div className="cat-product-card__rating">
          <span className="cat-product-card__rating-stars" aria-hidden="true">
            {"★".repeat(Math.round(product.rating))}
          </span>{" "}
          {product.rating.toFixed(1)} ({product.reviewCount})
        </div>
        <div className="cat-product-card__meta">
          <div className="cat-product-card__pricing">
            {hasDiscount ? (
              <span className="cat-product-card__price cat-product-card__price--was">
                {formatCurrency(originalPrice)}
              </span>
            ) : null}
            <span className="cat-product-card__price cat-product-card__price--sale">
              {formatCurrency(product.price)}
            </span>
          </div>
          <span
            className={`cat-product-card__badge ${availabilityClass(product.availability)}`}
          >
            {availabilityLabel(product.availability)}
          </span>
        </div>
        <button
          type="button"
          className="cat-product-card__add"
          onClick={handleAdd}
          disabled={product.availability === "out-of-stock"}
          aria-label={`Add ${product.name} to cart`}
        >
          Quick Add to Cart
        </button>
      </div>
    </article>
  );
}

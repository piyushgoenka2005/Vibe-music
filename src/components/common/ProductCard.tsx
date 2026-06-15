"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
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
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  function handleAdd() {
    if (product.availability === "out-of-stock") return;
    addItem(product);
    openDrawer();
  }

  return (
    <article
      className="cat-product-card"
      data-view={view}
      aria-label={`${product.brand} ${product.name}`}
    >
      <div style={{ position: "relative" }}>
        <Link
          href={`/product/${product.slug}`}
          className="cat-product-card__image"
          aria-hidden="true"
          tabIndex={-1}
        >
          <img
            src={optimizeImageUrl(product.image, "productCard")}
            alt=""
            className="cat-product-card__image-photo"
          />
        </Link>
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="cat-product-card__body">
        <div className="cat-product-card__brand">{product.brand}</div>
        <h3 className="cat-product-card__name">
          <Link href={`/product/${product.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
            {product.name}
          </Link>
        </h3>
        <div className="cat-product-card__rating">
          <span className="cat-product-card__rating-stars" aria-hidden="true">
            {"★".repeat(Math.round(product.rating))}
          </span>{" "}
          {product.rating.toFixed(1)} ({product.reviewCount})
        </div>
        <div className="cat-product-card__meta">
          <span className="cat-product-card__price">
            {formatCurrency(product.price)}
          </span>
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

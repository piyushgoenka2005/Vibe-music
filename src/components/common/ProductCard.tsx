"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useCompareStore } from "@/store/compareStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
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
  const addToCompare = useCompareStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
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

  function handleCompare(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const added = addToCompare(product);
    showToast(
      added ? "Added to compare" : "Compare list is full (max 4 items)",
      added ? "success" : "error"
    );
  }

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
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="cat-product-card__body">
        <div className="cat-product-card__brand">{product.brand}</div>
        <h3 className="cat-product-card__name">
          <Link
            href={productHref}
            prefetch
            onMouseEnter={prefetchProduct}
            onFocus={prefetchProduct}
            style={{ color: "inherit", textDecoration: "none" }}
          >
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
        <button
          type="button"
          className="cat-product-card__compare"
          onClick={handleCompare}
          aria-label={`Compare ${product.name}`}
          style={{
            marginTop: "0.35rem",
            width: "100%",
            background: "transparent",
            border: "1px solid currentColor",
            padding: "0.4rem",
            cursor: "pointer",
            fontSize: "0.8125rem",
          }}
        >
          Compare
        </button>
      </div>
    </article>
  );
}

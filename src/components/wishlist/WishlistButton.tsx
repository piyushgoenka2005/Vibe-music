"use client";

import { useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types/product";

interface WishlistButtonProps {
  product: Product;
  size?: number;
  className?: string;
}

export default function WishlistButton({
  product,
  size = 20,
  className = "",
}: WishlistButtonProps) {
  const isWishlisted = useWishlistStore((s) => s.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const btnRef = useRef<HTMLButtonElement>(null);
  const prevWishlisted = useRef(isWishlisted);

  useEffect(() => {
    if (prevWishlisted.current === isWishlisted) return;

    const node = btnRef.current;
    if (!node) return;

    node.classList.remove("wl-heart-btn--pop");
    void node.offsetWidth;
    node.classList.add("wl-heart-btn--pop");

    const timer = window.setTimeout(() => {
      node.classList.remove("wl-heart-btn--pop");
    }, 420);

    prevWishlisted.current = isWishlisted;
    return () => window.clearTimeout(timer);
  }, [isWishlisted]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={`wl-heart-btn${isWishlisted ? " wl-heart-btn--active" : ""} ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      aria-pressed={isWishlisted}
      aria-label={
        isWishlisted
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
    >
      <Heart size={size} fill={isWishlisted ? "currentColor" : "none"} />
    </button>
  );
}

"use client";

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

  return (
    <button
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

"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";

interface WishlistCounterProps {
  onClick?: () => void;
}

export default function WishlistCounter({ onClick }: WishlistCounterProps) {
  const count = useWishlistStore((s) => s.items.length);

  return (
    <button
      type="button"
      className="wl-nav-btn"
      onClick={onClick}
      aria-label={`Wishlist, ${count} items`}
    >
      <Heart size={20} strokeWidth={1.75} aria-hidden />
      {count > 0 ? (
        <span className="wl-nav-btn__count" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
      <span className="site-header__action-label">Wishlist</span>
    </button>
  );
}

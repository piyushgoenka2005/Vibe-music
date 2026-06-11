"use client";

import WishlistCounter from "@/components/wishlist/WishlistCounter";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import { useWishlistStore } from "@/store/wishlistStore";
import "@/components/wishlist/wishlist.css";

export default function WishlistMenu() {
  const openDrawer = useWishlistStore((s) => s.openDrawer);

  return (
    <div className="assets-site-header__menu-item wl-nav-mount" data-vibe-wishlist="true">
      <WishlistCounter onClick={openDrawer} />
      <WishlistDrawer />
    </div>
  );
}

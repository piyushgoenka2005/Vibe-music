"use client";

import { useCartStore } from "@/store/cartStore";

export default function CartPromoBanner() {
  const bannerText = useCartStore(
    (s) => s.promoConfig?.bannerText ?? "Free shipping on qualifying orders"
  );

  return (
    <p className="cart-promo-banner" role="note">
      <span className="cart-promo-banner__text">{bannerText}</span>
    </p>
  );
}

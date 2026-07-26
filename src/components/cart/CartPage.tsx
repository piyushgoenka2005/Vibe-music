"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { trackViewCart } from "@/lib/analytics/events";
import { cartItemsToAnalyticsLines } from "@/lib/analytics/cartLines";
import CartShell from "./CartShell";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import "./cart.css";

export default function CartPage() {
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    trackViewCart(cartItemsToAnalyticsLines(items));
  }, [items]);

  return (
    <div className="cart-page">
      <div className="storefront-nav-chrome cart-page__nav">
        <StorefrontBackButton />
      </div>
      <CartShell variant="page" />
    </div>
  );
}

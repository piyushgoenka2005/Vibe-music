"use client";

import CartShell from "./CartShell";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { useStorefrontBack } from "@/hooks/useStorefrontBack";
import "./cart.css";

export default function CartPage() {
  const { goBack } = useStorefrontBack({ fallbackHref: "/" });

  return (
    <div className="cart-page">
      <div className="storefront-nav-chrome cart-page__nav">
        <StorefrontBackButton />
      </div>
      <CartShell variant="page" onBrowse={goBack} />
    </div>
  );
}

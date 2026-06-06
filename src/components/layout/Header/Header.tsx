"use client";

import Link from "next/link";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { PHONE } from "@/lib/constants";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import TopBar from "./TopBar";
import Navigation from "./Navigation";
import SearchBar from "./SearchBar";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const openCartDrawer = useCartStore((s) => s.openDrawer);

  const accountLabel =
    isAuthenticated && user?.name
      ? user.name.split(" ")[0] || "Account"
      : "Account";
  const accountHref = isAuthenticated ? ROUTES.account : ROUTES.login;

  return (
    <header id="vibe-header" className="sticky top-0 z-50 bg-white">
      <TopBar />

      <div className="main-header">
        <div className="container">
          <Link href="/" className="logo">
            <div className="logo-text">
              Vibe<span>Music</span>
            </div>
          </Link>

          <SearchBar />

          <div className="header-actions">
            <Link
              href={`tel:${PHONE.replace(/\D/g, "")}`}
              className="header-action-col"
            >
              <span className="header-action-phone">{PHONE}</span>
              <span className="header-action-sub">Talk to an expert!</span>
            </Link>

            <Link href={ROUTES.search} className="header-action-link">
              Contact Us
              <ChevronDown size={10} strokeWidth={3} />
            </Link>

            <Link href={accountHref} className="header-action-link">
              {accountLabel}
              <ChevronDown size={10} strokeWidth={3} />
            </Link>

            <button
              type="button"
              className="header-cart"
              aria-label={
                cartCount === 0
                  ? "No items in your cart"
                  : `${cartCount} item${cartCount === 1 ? "" : "s"} in your cart`
              }
              onClick={openCartDrawer}
            >
              <ShoppingCart size={26} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="header-cart-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <Navigation />
    </header>
  );
}

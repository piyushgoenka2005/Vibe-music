"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useHideOnScroll, useSiteHeaderOffset } from "@/hooks/useHideOnScroll";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SiteHeaderNav from "@/components/layout/SiteHeaderNav";
import SearchRollingPlaceholder, {
  SEARCH_ROLLING_ARIA_LABEL,
} from "@/components/search/SearchRollingPlaceholder";
import WishlistCounter from "@/components/wishlist/WishlistCounter";

export default function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerHidden = useHideOnScroll({ disabled: mobileOpen });

  useSiteHeaderOffset(headerRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMegaMenuOpenChange = useCallback(() => {}, []);

  useEffect(() => {
    document.body.classList.toggle("site-nav-open", mobileOpen);
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.classList.remove("site-nav-open");
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  const { user, isAuthenticated, isInitialized } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    }))
  );

  const accountHref = isAuthenticated ? ROUTES.account : ROUTES.login;
  const accountLabel =
    isInitialized && isAuthenticated && user?.name
      ? user.name.split(" ")[0]
      : "Account";
  const accountPhotoUrl =
    isInitialized && isAuthenticated ? user?.photoURL ?? null : null;

  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const openWishlistDrawer = useWishlistStore((s) => s.openDrawer);
  const cartCountRef = useRef<HTMLSpanElement>(null);
  const prevCartCountRef = useRef(cartCount);

  const cartCountText = cartCount > 0 ? String(cartCount) : "";
  const cartDataCount = cartCount > 99 ? "99+" : String(cartCount);
  const cartLabel =
    cartCount === 0
      ? "No items in your cart"
      : `${cartCount} item${cartCount === 1 ? "" : "s"} in your cart`;

  useEffect(() => {
    const el = cartCountRef.current;
    if (!el || cartCount <= prevCartCountRef.current) {
      prevCartCountRef.current = cartCount;
      return;
    }

    el.classList.remove("site-header__cart-count--bump");
    void el.offsetWidth;
    el.classList.add("site-header__cart-count--bump");
    const timer = window.setTimeout(() => {
      el.classList.remove("site-header__cart-count--bump");
    }, 450);
    prevCartCountRef.current = cartCount;

    return () => window.clearTimeout(timer);
  }, [cartCount]);

  const handleCartClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      openCartDrawer();
    },
    [openCartDrawer]
  );

  return (
    <header
      ref={headerRef}
      id="assets-header"
      className={`site-header assets-site-nav--desktop${headerHidden ? " site-header--hidden" : ""}${scrolled ? " site-header--scrolled" : ""}`}
      data-vibe-section="header"
    >
      <AnnouncementBar />

      <div className="site-header__bar">
        <div className="site-header__inner">
          <button
            type="button"
            className="site-header__menu-btn"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href={ROUTES.home} className="site-header__logo" aria-label={BRAND.name}>
            <Image
              src={BRAND.headerLogoPath}
              alt={BRAND.name}
              width={220}
              height={56}
              priority
              className="assets-site-header__menu-logo"
            />
          </Link>

          <form
            className="site-header__search assets-site-header__menu-search-form"
            action={ROUTES.searchResults}
            method="get"
            onSubmit={(e) => e.preventDefault()}
          >
            <Search size={16} className="site-header__search-icon" aria-hidden />
            <div className="site-header__search-field">
              <input
                id="sw-search-input"
                name="q"
                type="search"
                className="site-header__search-input assets-site-header__menu-search-typeahead-field"
                placeholder=" "
                autoComplete="off"
                aria-label={SEARCH_ROLLING_ARIA_LABEL}
              />
              <SearchRollingPlaceholder inputId="sw-search-input" />
            </div>
            <button
              type="submit"
              className="site-header__search-submit assets-site-header__menu-search-submit"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
          </form>

          <div className="site-header__actions">
            <Link
              href={accountHref}
              className="site-header__action assets-site-header__menu-account"
              aria-label={accountLabel}
            >
              {accountPhotoUrl ? (
                <img
                  src={accountPhotoUrl}
                  alt=""
                  className="site-header__avatar"
                  width={26}
                  height={26}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={18} aria-hidden />
              )}
              <span className="site-header__action-label assets-site-header__menu-account-navlink">
                {accountLabel}
              </span>
            </Link>

            <div className="assets-site-header__menu-cart-wrap">
              <WishlistCounter onClick={openWishlistDrawer} />
            </div>

            <Link
              href={ROUTES.cart}
              className="site-header__action site-header__cart assets-site-header__menu-cart"
              aria-label={cartLabel}
              onClick={handleCartClick}
            >
              <ShoppingCart size={18} />
              <span
                ref={cartCountRef}
                className="site-header__cart-count assets-site-header__menu-cart-count"
                data-count={cartDataCount}
              >
                {cartCountText}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <SiteHeaderNav
        onNavigate={() => setMobileOpen(false)}
        onMegaMenuOpenChange={handleMegaMenuOpenChange}
      />

      {/* Mobile nav account states (legacy CSS hooks) */}
      <div className="site-header__auth-hooks" aria-hidden>
        <div
          className={`assets-site-header__nav-menu-account-logged-in${isAuthenticated ? "" : " removed"}`}
        />
        <div
          className={`assets-site-header__nav-menu-account-logged-out${isAuthenticated ? " removed" : ""}`}
        >
          <a
            href={ROUTES.login}
            className="assets-site-header__nav-menu-account-logged-out-login-button"
          >
            Log in
          </a>
          <a
            href={ROUTES.register}
            className="assets-site-header__nav-menu-account-logged-out-login-signup"
          >
            Sign up
          </a>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="site-header__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      ) : null}
    </header>
  );
}

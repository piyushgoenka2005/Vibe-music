"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { useHeaderScrollHide } from "@/hooks/useHeaderScrollHide";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SiteHeaderNav from "@/components/layout/SiteHeaderNav";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname() ?? "";
  const isProductPage = pathname.startsWith("/product/");
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const cartDrawerOpen = useCartStore((s) => s.drawerOpen);
  const wishlistDrawerOpen = useWishlistStore((s) => s.drawerOpen);

  const scrollHidePaused =
    mobileOpen || megaMenuOpen || cartDrawerOpen || wishlistDrawerOpen;
  const headerHidden = useHeaderScrollHide({
    enabled: isProductPage,
    paused: scrollHidePaused,
  });

  const handleMegaMenuOpenChange = useCallback((open: boolean) => {
    setMegaMenuOpen(open);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("pdp-scroll-header", isProductPage);
    return () => document.body.classList.remove("pdp-scroll-header");
  }, [isProductPage]);

  useEffect(() => {
    if (!isProductPage || !headerRef.current) return;

    const el = headerRef.current;
    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${el.offsetHeight}px`
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, [isProductPage]);

  useEffect(() => {
    document.body.classList.toggle("site-nav-open", mobileOpen);
    return () => document.body.classList.remove("site-nav-open");
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  const accountHref = isAuthenticated ? ROUTES.account : ROUTES.login;
  const accountLabel =
    isInitialized && isAuthenticated && user?.name
      ? user.name.split(" ")[0]
      : "Account";
  const accountPhotoUrl =
    isInitialized && isAuthenticated ? user?.photoURL ?? null : null;

  return (
    <header
      ref={headerRef}
      id="assets-header"
      className={`site-header assets-site-nav--desktop${
        isProductPage ? " site-header--scroll-aware" : ""
      }${headerHidden ? " site-header--scroll-hidden" : ""}`}
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
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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
            <Search size={18} className="site-header__search-icon" aria-hidden />
            <input
              id="sw-search-input"
              name="q"
              type="search"
              className="site-header__search-input assets-site-header__menu-search-typeahead-field"
              placeholder="Search guitars, mics, studio gear…"
              autoComplete="off"
            />
            <button
              type="submit"
              className="site-header__search-submit assets-site-header__menu-search-submit"
              aria-label="Search"
            >
              <Search size={16} />
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
                  width={28}
                  height={28}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={20} aria-hidden />
              )}
              <span className="site-header__action-label assets-site-header__menu-account-navlink">
                {accountLabel}
              </span>
            </Link>

            <div className="assets-site-header__menu-cart-wrap" data-vibe-wishlist-anchor>
              {/* Wishlist mounts here via NavbarWishlist */}
            </div>

            <Link
              href={ROUTES.cart}
              className="site-header__action site-header__cart assets-site-header__menu-cart"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              <span
                className="site-header__cart-count assets-site-header__menu-cart-count"
                data-count="0"
              />
            </Link>
          </div>
        </div>
      </div>

      <SiteHeaderNav
        onNavigate={() => setMobileOpen(false)}
        onMegaMenuOpenChange={handleMegaMenuOpenChange}
      />

      {/* Legacy auth sync hooks — hidden, updated by NavbarAuth */}
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

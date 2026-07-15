"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import SiteHeaderMobileDrawer from "@/components/layout/SiteHeaderMobileDrawer";
import SearchRollingPlaceholder, {
  SEARCH_ROLLING_ARIA_LABEL,
} from "@/components/search/SearchRollingPlaceholder";
import { MIN_QUERY_LENGTH } from "@/services/search.service";
import { searchStore } from "@/store/searchStore";
import WishlistCounter from "@/components/wishlist/WishlistCounter";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const headerRef = useRef<HTMLElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerHidden = useHideOnScroll({ disabled: mobileOpen, disableOnMobile: true });

  useSiteHeaderOffset(headerRef);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

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
    window.dispatchEvent(new Event("site-header:sync"));
    return () => {
      document.body.classList.remove("site-nav-open");
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
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

  const cartCountText = cartCount > 99 ? "99+" : String(cartCount);
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

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const query = String(formData.get("q") ?? "").trim();
      if (query.length < MIN_QUERY_LENGTH) return;
      router.push(`${ROUTES.searchResults}?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  const handleMobileSearchOpen = useCallback(() => {
    setMobileOpen(false);
    const rect = searchToggleRef.current?.getBoundingClientRect() ?? null;
    searchStore.openOverlay(rect, "sw-search-input-mobile", true);
  }, []);

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
          <a
            href={ROUTES.home}
            className="site-header__logo"
            aria-label={BRAND.name}
            onClick={(event) => {
              event.preventDefault();
              // Always return to the landing page with a full page load.
              window.location.href = ROUTES.home;
            }}
          >
            <Image
              src={BRAND.headerLogoPath}
              alt={BRAND.name}
              width={220}
              height={56}
              priority
              className="assets-site-header__menu-logo"
              style={{ width: "auto", height: "auto" }}
            />
          </a>

          <form
            className="site-header__search site-header__search--bar assets-site-header__menu-search-form"
            action={ROUTES.searchResults}
            method="get"
            onSubmit={handleSearchSubmit}
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

          <button
            ref={searchToggleRef}
            type="button"
            className="site-header__search-toggle"
            onClick={handleMobileSearchOpen}
            aria-label="Open search"
          >
            <Search size={22} aria-hidden />
          </button>

          <div className="site-header__actions">
            <div className="site-header__account-wrap">
              <Link
                href={accountHref}
                className="site-header__action site-header__action--account assets-site-header__menu-account"
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
              {isInitialized && !isAuthenticated ? (
                <Link href={ROUTES.login} className="login-nudge">
                  Login
                </Link>
              ) : null}
            </div>

            <div className="site-header__action--desktop-only assets-site-header__menu-cart-wrap">
              <WishlistCounter onClick={openWishlistDrawer} />
            </div>

            <Link
              href={ROUTES.cart}
              className="site-header__action site-header__cart assets-site-header__menu-cart"
              aria-label={cartLabel}
              onClick={handleCartClick}
            >
              <ShoppingCart size={20} />
              <span
                ref={cartCountRef}
                className="site-header__cart-count assets-site-header__menu-cart-count"
                data-count={cartDataCount}
              >
                {cartCountText}
              </span>
            </Link>
          </div>

          <button
            type="button"
            className="site-header__menu-btn"
            onClick={() => {
              searchStore.closeOverlay();
              setMobileOpen((open) => !open);
            }}
            aria-expanded={mobileOpen}
            aria-controls="site-header-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            <span className="site-header__menu-label">{mobileOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      <SiteHeaderNav onMegaMenuOpenChange={handleMegaMenuOpenChange} />

      <SiteHeaderMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
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
    </header>
  );
}

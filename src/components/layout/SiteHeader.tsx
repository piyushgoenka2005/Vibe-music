"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import { useIsCompactHeaderViewport } from "@/hooks/useIsMobileViewport";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SiteHeaderNav from "@/components/layout/SiteHeaderNav";
import SiteHeaderMobileDrawer from "@/components/layout/SiteHeaderMobileDrawer";
import SearchRollingPlaceholder from "@/components/search/SearchRollingPlaceholder";
import { MIN_QUERY_LENGTH } from "@/services/search.service";
import { searchStore } from "@/store/searchStore";
import WishlistCounter from "@/components/wishlist/WishlistCounter";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import type {
  HeaderSettingRecord,
  NavigationMenuItemRecord,
} from "@/lib/server/navigation/navigationRepository";

interface SiteHeaderProps {
  shippingAnnouncement?: string;
  brandsMegaMenu?: MegaMenuItem | null;
  categoryMegaMenus?: MegaMenuItem[] | null;
  utilityItems?: NavigationMenuItemRecord[] | null;
  configuredNavItems?: NavigationMenuItemRecord[] | null;
  headerSettings?: HeaderSettingRecord | null;
}

export default function SiteHeader({
  shippingAnnouncement,
  brandsMegaMenu = null,
  categoryMegaMenus = null,
  utilityItems = null,
  configuredNavItems = null,
  headerSettings = null,
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const headerRef = useRef<HTMLElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isCompactHeader = useIsCompactHeaderViewport();
  const headerHidden = useHideOnScroll({ disabled: mobileOpen, disableOnMobile: true });

  useSiteHeaderOffset(headerRef);

  const handleLogoClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname === ROUTES.home) {
        event.preventDefault();
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    },
    [pathname],
  );

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
    window.dispatchEvent(new Event("site-header:sync"));
  }, [pathname]);

  useEffect(() => {
    if (
      !isCompactHeader &&
      mobileOpen &&
      typeof window !== "undefined" &&
      !window.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileOpen(false);
    }
  }, [isCompactHeader, mobileOpen]);

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

  const toggleMobileNav = useCallback(() => {
    searchStore.closeOverlay();
    setMobileOpen((open) => !open);
  }, []);

  const { user, isAuthenticated, isInitialized } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    })),
  );

  const accountHref =
    headerSettings?.profileDestination || (isAuthenticated ? ROUTES.account : ROUTES.login);
  const accountAriaLabel =
    isInitialized && isAuthenticated && user?.name ? user.name.split(" ")[0] : "Account";
  const accountPhotoUrl = isInitialized && isAuthenticated ? (user?.photoURL ?? null) : null;

  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
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
    [openCartDrawer],
  );

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const query = String(formData.get("q") ?? "").trim();
      if (query.length < MIN_QUERY_LENGTH) return;
      router.push(`${ROUTES.searchResults}?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleMobileSearchOpen = useCallback(() => {
    setMobileOpen(false);
    const rect = searchToggleRef.current?.getBoundingClientRect() ?? null;
    searchStore.openOverlay(rect, "sw-search-input-mobile", true);
  }, []);

  const searchPlaceholder =
    headerSettings?.searchPlaceholder || "Search for guitars, keyboards, microphones and more...";
  const logoSrc = headerSettings?.logoAsset || BRAND.headerLogoPath;

  return (
    <header
      ref={headerRef}
      id="assets-header"
      className={`site-header assets-site-nav--desktop${headerHidden ? " site-header--hidden" : ""}${scrolled ? " site-header--scrolled" : ""}`}
      data-vibe-section="header"
    >
      {/* Row 1: Utility / Announcement Bar */}
      <AnnouncementBar
        announcement={headerSettings?.shippingAnnouncement || shippingAnnouncement}
        items={utilityItems ?? undefined}
        active={headerSettings?.utilityBarActive ?? true}
      />

      {/* Row 2: Main Header Bar */}
      <div className="site-header__bar">
        <div className="site-header__inner">
          <Link
            href={ROUTES.home}
            className="site-header__logo"
            aria-label={BRAND.name}
            scroll={false}
            onClick={handleLogoClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={BRAND.name}
              className="assets-site-header__menu-logo"
              decoding="async"
              fetchPriority="high"
              height={58}
              src={logoSrc}
              width={240}
            />
          </Link>

          {headerSettings?.searchVisibility !== false ? (
            <form
              className="site-header__search site-header__search--bar assets-site-header__menu-search-form"
              action={ROUTES.searchResults}
              method="get"
              onSubmit={handleSearchSubmit}
            >
              <Search size={18} className="site-header__search-icon" aria-hidden />
              <div className="site-header__search-field">
                <input
                  id="sw-search-input"
                  name="q"
                  type="search"
                  className="site-header__search-input assets-site-header__menu-search-typeahead-field"
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  aria-label={searchPlaceholder}
                />
                <SearchRollingPlaceholder inputId="sw-search-input" />
              </div>
              <button
                type="submit"
                className="site-header__search-submit assets-site-header__menu-search-submit"
                aria-label="Search"
              >
                <Search
                  size={18}
                  strokeWidth={2.2}
                  className="site-header__search-submit-icon"
                  aria-hidden
                />
              </button>
            </form>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div className="site-header__toolbar">
            <button
              ref={searchToggleRef}
              type="button"
              className="site-header__search-toggle"
              onClick={handleMobileSearchOpen}
              aria-label="Open search"
            >
              <Search size={22} strokeWidth={1.75} aria-hidden />
            </button>

            <div className="site-header__actions">
              {headerSettings?.profileVisibility !== false ? (
                <div className="site-header__account-wrap">
                  <Link
                    href={accountHref}
                    className="site-header__action site-header__action--account assets-site-header__menu-account"
                    aria-label={accountAriaLabel}
                  >
                    {accountPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- OAuth avatar requires referrerPolicy
                      <img
                        src={accountPhotoUrl}
                        alt=""
                        className="site-header__avatar"
                        width={28}
                        height={28}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={20} strokeWidth={1.75} aria-hidden />
                    )}
                    <span className="site-header__action-label assets-site-header__menu-account-navlink">
                      Profile
                    </span>
                  </Link>
                </div>
              ) : null}

              {headerSettings?.wishlistVisibility !== false ? (
                <div className="site-header__action--desktop-only assets-site-header__menu-cart-wrap">
                  <WishlistCounter onClick={openWishlistDrawer} />
                </div>
              ) : null}

              {headerSettings?.cartVisibility !== false ? (
                <Link
                  href={headerSettings?.cartDestination || ROUTES.cart}
                  className="site-header__action site-header__cart assets-site-header__menu-cart"
                  aria-label={cartLabel}
                  onClick={handleCartClick}
                >
                  <ShoppingCart size={20} strokeWidth={1.75} aria-hidden />
                  {cartCount > 0 ? (
                    <span
                      ref={cartCountRef}
                      className="site-header__cart-count assets-site-header__menu-cart-count"
                      data-count={cartDataCount}
                      aria-hidden="true"
                    >
                      {cartCountText}
                    </span>
                  ) : null}
                  <span className="site-header__action-label" aria-hidden="true">
                    Cart
                  </span>
                </Link>
              ) : null}
            </div>

            <button
              type="button"
              className={`site-header__menu-btn${mobileOpen ? " is-open" : ""}`}
              onClick={toggleMobileNav}
              aria-expanded={mobileOpen}
              aria-controls="site-header-mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X size={24} strokeWidth={1.75} aria-hidden />
              ) : (
                <>
                  <Menu size={22} strokeWidth={1.75} aria-hidden />
                  <span className="site-header__menu-label">Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Primary Navigation */}
      <Suspense fallback={null}>
        <SiteHeaderNav
          brandsMegaMenu={brandsMegaMenu}
          categoryMegaMenus={categoryMegaMenus}
          configuredNavItems={configuredNavItems}
          onMegaMenuOpenChange={handleMegaMenuOpenChange}
        />
      </Suspense>

      <SiteHeaderMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNavigate={() => setMobileOpen(false)}
        brandsMegaMenu={brandsMegaMenu}
        categoryMegaMenus={categoryMegaMenus}
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

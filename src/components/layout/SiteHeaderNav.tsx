"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { HEADER_MEGA_MENUS, MEGA_MENU_BY_SLUG, type MegaMenuItem } from "@/data/headerMegaMenu";
import { BRANDS_MEGA_MENU_SLUG, resolveBrandsMegaMenu } from "@/lib/navigation/buildBrandsMegaMenu";
import { ROUTES } from "@/lib/routes";
import { isHeaderNavItemActive } from "@/lib/navigation/headerNavActive";
import HeaderMegaMenu from "@/components/layout/HeaderMegaMenu";
import AllCategoriesMegaMenu from "@/components/layout/AllCategoriesMegaMenu";
import type { NavigationMenuItemRecord } from "@/lib/server/navigation/navigationRepository";

function SearchParamsWatcher({
  onParamsChange,
}: {
  onParamsChange: (category: string | null, q: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  useEffect(() => {
    onParamsChange(category, q);
  }, [category, q, onParamsChange]);

  return null;
}

interface SiteHeaderNavProps {
  brandsMegaMenu?: MegaMenuItem | null;
  categoryMegaMenus?: MegaMenuItem[] | null;
  configuredNavItems?: NavigationMenuItemRecord[] | null;
  onNavigate?: () => void;
  onMegaMenuOpenChange?: (open: boolean) => void;
}

const HOVER_CLOSE_DELAY_MS = 140;

interface NavGooItem {
  key: string;
  label: string;
  href: string;
  slug?: string;
  hasDropdown?: boolean;
  badge?: string | null;
  accent?: boolean;
  active?: boolean;
  routeActive?: boolean;
}

export default function SiteHeaderNav({
  brandsMegaMenu = null,
  categoryMegaMenus = null,
  configuredNavItems = null,
  onNavigate,
  onMegaMenuOpenChange,
}: SiteHeaderNavProps) {
  const pathname = usePathname() ?? "";
  const [searchParamsState, setSearchParamsState] = useState<{
    category: string | null;
    q: string | null;
  }>({ category: null, q: null });

  const handleParamsChange = useCallback((category: string | null, q: string | null) => {
    setSearchParamsState((prev) => {
      if (prev.category === category && prev.q === q) return prev;
      return { category, q };
    });
  }, []);

  const searchCategory = searchParamsState.category;
  const searchQuery = searchParamsState.q;
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [scrollable, setScrollable] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navShellRef = useRef<HTMLDivElement>(null);

  const resolvedBrandsMegaMenu = useMemo(
    () => resolveBrandsMegaMenu(brandsMegaMenu),
    [brandsMegaMenu],
  );

  const effectiveCategoryMenus = useMemo(
    () =>
      categoryMegaMenus !== null && categoryMegaMenus !== undefined && categoryMegaMenus.length > 0
        ? categoryMegaMenus
        : HEADER_MEGA_MENUS,
    [categoryMegaMenus],
  );

  const megaMenuBySlug = useMemo(() => {
    const menus = { ...MEGA_MENU_BY_SLUG };
    for (const menu of effectiveCategoryMenus) {
      menus[menu.slug] = menu;
    }
    if (resolvedBrandsMegaMenu) {
      menus[BRANDS_MEGA_MENU_SLUG] = resolvedBrandsMegaMenu;
    }

    // Merge any item-level megaMenuData overrides configured in admin
    if (configuredNavItems && configuredNavItems.length > 0) {
      for (const item of configuredNavItems) {
        if (item.megaMenuData && typeof item.megaMenuData === "object") {
          const customData = item.megaMenuData as {
            featured?: { title: string; href: string; image: string }[];
          };
          const slug =
            item.categoryId ||
            item.url.replace(/^\/category\//, "").split("?")[0] ||
            item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          const matchedSlug =
            (item.categoryId && menus[item.categoryId] ? item.categoryId : null) ||
            Object.keys(menus).find(
              (s) =>
                item.url.includes(s) ||
                menus[s]?.name?.toLowerCase() === item.label.toLowerCase() ||
                item.categoryId === s,
            ) ||
            slug;

          if (
            matchedSlug &&
            menus[matchedSlug] &&
            customData.featured &&
            customData.featured.length > 0
          ) {
            menus[matchedSlug] = {
              ...menus[matchedSlug],
              featured: customData.featured.map((card, idx) => ({
                title: card.title || menus[matchedSlug].featured[idx]?.title || "",
                href: card.href || menus[matchedSlug].featured[idx]?.href || item.url,
                image: card.image || menus[matchedSlug].featured[idx]?.image || "",
              })),
            };
          }
        }
      }
    }

    return menus;
  }, [effectiveCategoryMenus, resolvedBrandsMegaMenu, configuredNavItems]);

  // Build navigation items from configured admin navigation if present, or stable defaults
  const navItems: NavGooItem[] = useMemo(() => {
    if (configuredNavItems && configuredNavItems.length > 0) {
      // Filter out "All Categories" if configured as an item, since it gets its own special trigger
      return configuredNavItems
        .filter(
          (item) =>
            item.label.toLowerCase() !== "all categories" && item.isActive && item.visibleDesktop,
        )
        .map((item) => {
          let slug: string | undefined = undefined;
          if (item.url.includes("/brands")) {
            slug = resolvedBrandsMegaMenu ? BRANDS_MEGA_MENU_SLUG : undefined;
          } else {
            const match = effectiveCategoryMenus.find(
              (m) =>
                item.url.includes(m.slug) ||
                item.label.toLowerCase() === m.name.toLowerCase() ||
                item.categoryId === m.slug,
            );
            if (match) slug = match.slug;
          }

          const hasDropdown =
            item.itemType === "dropdown" || item.itemType === "mega_menu" || Boolean(slug);

          return {
            key: item.id,
            label: item.label,
            href: item.url,
            slug,
            hasDropdown,
            badge: item.badgeText,
          };
        });
    }

    // Default approved list
    return [
      {
        key: "brands",
        label: "Brands",
        href: ROUTES.brands,
        slug: resolvedBrandsMegaMenu ? BRANDS_MEGA_MENU_SLUG : undefined,
        hasDropdown: true,
      },
      ...effectiveCategoryMenus.map((menu) => ({
        key: menu.slug,
        label: menu.name,
        href: menu.href,
        slug: menu.slug,
        hasDropdown: true,
      })),
      {
        key: "deals",
        label: "Deals",
        href: ROUTES.deals,
        badge: "Hot",
      },
      {
        key: "today-deals",
        label: "Today Deals",
        href: ROUTES.deals,
      },
      {
        key: "gp9",
        label: "Grand Piano",
        href: ROUTES.gp9,
        badge: "Flagship",
      },
    ];
  }, [configuredNavItems, effectiveCategoryMenus, resolvedBrandsMegaMenu]);

  const resolvedNavItems = useMemo(
    () =>
      navItems.map((item) => {
        const routeActive = isHeaderNavItemActive({
          key: item.key,
          href: item.href,
          slug: item.slug,
          pathname,
          searchCategory,
          searchQuery,
        });
        return {
          ...item,
          active: routeActive,
          routeActive,
        };
      }),
    [navItems, pathname, searchCategory, searchQuery],
  );

  useEffect(() => {
    const el = navShellRef.current?.querySelector(".site-header__nav-inner");
    if (!el) return;

    const check = () => queueMicrotask(() => setScrollable(el.scrollWidth > el.clientWidth));
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setActiveSlug(null);
      setAllCategoriesOpen(false);
    });
  }, [pathname]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(
    (slug: string) => {
      clearCloseTimer();
      setAllCategoriesOpen(false);
      setActiveSlug(slug);
    },
    [clearCloseTimer],
  );

  const openAllCategories = useCallback(() => {
    clearCloseTimer();
    setActiveSlug(null);
    setAllCategoriesOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveSlug(null);
      setAllCategoriesOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const handleNavigate = useCallback(() => {
    setActiveSlug(null);
    setAllCategoriesOpen(false);
    setHoveredKey(null);
    onNavigate?.();
  }, [onNavigate]);

  const activeMenu = activeSlug ? (megaMenuBySlug[activeSlug] ?? null) : null;

  useEffect(() => {
    onMegaMenuOpenChange?.(Boolean(activeSlug || allCategoriesOpen));
  }, [activeSlug, allCategoriesOpen, onMegaMenuOpenChange]);

  return (
    <nav
      id="site-header-nav"
      className="site-header__nav site-header__nav--desktop assets-site-header__nav"
      aria-label="Shop categories and navigation"
      onMouseLeave={() => {
        scheduleClose();
        setHoveredKey(null);
      }}
    >
      <Suspense fallback={null}>
        <SearchParamsWatcher onParamsChange={handleParamsChange} />
      </Suspense>

      <div
        ref={navShellRef}
        className={`site-header__nav-shell${scrollable ? " site-header__nav-shell--scrollable" : ""}`}
      >
        <div className="site-header__nav-inner">
          {/* Prominent Blue "All Categories" Dropdown Trigger */}
          <div className="site-header__all-cats-wrapper" onMouseEnter={openAllCategories}>
            <button
              type="button"
              className={`site-header__all-cats-btn${allCategoriesOpen ? " is-active" : ""}`}
              onClick={() => setAllCategoriesOpen((prev) => !prev)}
              aria-expanded={allCategoriesOpen}
              aria-haspopup="true"
              aria-label="Browse all categories"
            >
              <LayoutGrid size={16} className="site-header__all-cats-icon" aria-hidden />
              <span>All Categories</span>
              <ChevronDown
                size={14}
                className={`site-header__all-cats-chevron${allCategoriesOpen ? " is-rotated" : ""}`}
                aria-hidden
              />
            </button>
          </div>

          {/* Primary Navigation Items */}
          <div
            className="site-header__nav-items-list"
            role="list"
            onMouseLeave={() => setHoveredKey(null)}
          >
            {resolvedNavItems.map((item) => (
              <div
                key={item.key}
                className={`site-header__nav-item-unit${item.active ? " is-active" : ""}${hoveredKey === item.key ? " is-hovered" : ""}`}
                role="listitem"
                onMouseEnter={() => {
                  setHoveredKey(item.key);
                  if (item.slug) {
                    openMenu(item.slug);
                  } else {
                    setActiveSlug(null);
                    setAllCategoriesOpen(false);
                  }
                }}
              >
                <Link
                  href={item.href}
                  className="site-header__nav-item-link"
                  onClick={handleNavigate}
                  aria-current={item.routeActive ? "page" : undefined}
                  aria-expanded={item.slug ? activeSlug === item.slug : undefined}
                  aria-haspopup={item.slug ? "true" : undefined}
                >
                  <span>{item.label}</span>
                  {item.badge ? <span className="site-header__nav-badge">{item.badge}</span> : null}
                  {item.hasDropdown ? (
                    <ChevronDown size={12} className="site-header__nav-chevron" aria-hidden />
                  ) : null}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menus Panel */}
        <div onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
          <AllCategoriesMegaMenu
            open={allCategoriesOpen}
            onClose={() => setAllCategoriesOpen(false)}
            onNavigate={handleNavigate}
          />
          <HeaderMegaMenu menu={activeMenu} open={Boolean(activeMenu)} />
        </div>
      </div>
    </nav>
  );
}

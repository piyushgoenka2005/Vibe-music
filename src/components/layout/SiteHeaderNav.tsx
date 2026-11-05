"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import {
  HEADER_MEGA_MENUS,
  MEGA_MENU_BY_SLUG,
  type MegaMenuItem,
  type MegaMenuColumn,
} from "@/data/headerMegaMenu";
import { BRANDS_MEGA_MENU_SLUG, resolveBrandsMegaMenu } from "@/lib/navigation/buildBrandsMegaMenu";
import { extractCategorySlugFromUrl, extractSlugFromUrl, ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/slug";
import { getCategoryHeroImage, getMegaMenuFeaturedImage } from "@/lib/categoryImages";
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
  categoryId?: string | null;
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

  const effectiveCategoryMenus = useMemo(() => {
    if (!categoryMegaMenus || categoryMegaMenus.length === 0) return HEADER_MEGA_MENUS;

    const generatedBySlug = new Map(categoryMegaMenus.map((menu) => [menu.slug, menu]));
    const orderedMenus = HEADER_MEGA_MENUS.map(
      (baseline) => generatedBySlug.get(baseline.slug) ?? baseline,
    );
    const baselineSlugs = new Set(HEADER_MEGA_MENUS.map((menu) => menu.slug));
    const additionalMenus = categoryMegaMenus.filter((menu) => !baselineSlugs.has(menu.slug));

    // Deduplicate by slug to prevent duplicate keys in rendering
    const seen = new Set(orderedMenus.map((m) => m.slug));
    const deduped = additionalMenus.filter((menu) => {
      if (seen.has(menu.slug)) {
        return false;
      }
      seen.add(menu.slug);
      return true;
    });

    return [...orderedMenus, ...deduped];
  }, [categoryMegaMenus]);

  const megaMenuBySlug = useMemo(() => {
    const menus: Record<string, MegaMenuItem> = { ...MEGA_MENU_BY_SLUG };
    for (const menu of effectiveCategoryMenus) {
      menus[menu.slug] = menu;
      menus[`cat_${menu.slug}`] = menu;
      menus[`cat-${menu.slug}`] = menu;
      menus[menu.name.toLowerCase()] = menu;
    }
    if (resolvedBrandsMegaMenu) {
      menus[BRANDS_MEGA_MENU_SLUG] = resolvedBrandsMegaMenu;
    }

    // Ensure every configured item with dropdown/mega_menu has a valid MegaMenuItem in menus
    if (configuredNavItems && configuredNavItems.length > 0) {
      for (const item of configuredNavItems) {
        const urlCatSlug = extractCategorySlugFromUrl(item.url);
        const itemSlug =
          urlCatSlug ||
          (item.categoryId ? item.categoryId.replace(/^cat[-_]/, "") : undefined) ||
          item.categoryId ||
          extractSlugFromUrl(item.url) ||
          slugify(item.label) ||
          item.id;

        // Check if already in menus under any related key
        let existing =
          menus[itemSlug] ||
          (urlCatSlug && menus[urlCatSlug]) ||
          (item.categoryId && menus[item.categoryId]) ||
          (item.categoryId && menus[item.categoryId.replace(/^cat[-_]/, "")]) ||
          menus[item.id] ||
          menus[slugify(item.label)] ||
          menus[item.label.toLowerCase()];

        if (!existing) {
          const foundKey = Object.keys(menus).find(
            (k) =>
              menus[k]?.name?.toLowerCase() === item.label.toLowerCase() ||
              (urlCatSlug &&
                (k === urlCatSlug || k.includes(urlCatSlug) || urlCatSlug.includes(k))) ||
              (item.categoryId && (k === item.categoryId || item.categoryId.includes(k))) ||
              item.url.includes(k),
          );
          if (foundKey && menus[foundKey]) {
            existing = menus[foundKey];
          }
        }

        // If still no menu exists and this item is a dropdown or mega_menu, synthesize one!
        if (!existing && (item.itemType === "dropdown" || item.itemType === "mega_menu")) {
          const childItems = configuredNavItems.filter((c) => c.parentId === item.id && c.isActive);
          const synthesizedColumns: MegaMenuColumn[] =
            childItems.length > 0
              ? [
                  {
                    heading: item.label,
                    links: childItems.map((c) => ({ label: c.label, href: c.url })),
                  },
                ]
              : [
                  {
                    heading: item.label,
                    links: [
                      { label: `All ${item.label}`, href: item.url },
                      { label: `Shop all ${item.label}`, href: item.url },
                      {
                        label: "New Arrivals",
                        href: `${item.url}${item.url.includes("?") ? "&" : "?"}sort=newest`,
                      },
                    ],
                  },
                ];

          existing = {
            slug: itemSlug,
            name: item.label,
            href: item.url,
            columns: synthesizedColumns,
            featured: [
              {
                title: item.label,
                href: item.url,
                image: getCategoryHeroImage(itemSlug) || "/brand/header-logo.webp",
              },
              {
                title: `Explore ${item.label}`,
                href: `${item.url}${item.url.includes("?") ? "&" : "?"}sort=newest`,
                image: getMegaMenuFeaturedImage(itemSlug, "secondary") || "/images/New Guitar.png",
              },
            ],
          };
        }

        // If we have an existing or synthesized menu, index it under all aliases
        if (existing) {
          menus[itemSlug] = existing;
          menus[item.id] = existing;
          if (item.categoryId) {
            menus[item.categoryId] = existing;
            menus[item.categoryId.replace(/^cat[-_]/, "")] = existing;
          }
          if (urlCatSlug) menus[urlCatSlug] = existing;
          menus[item.label.toLowerCase()] = existing;
          menus[slugify(item.label)] = existing;

          // Merge any item-level megaMenuData overrides configured in admin
          if (item.megaMenuData && typeof item.megaMenuData === "object") {
            const customData = item.megaMenuData as {
              featured?: { title: string; href: string; image: string }[];
            };
            if (customData.featured && customData.featured.length > 0) {
              const updatedMenu = {
                ...existing,
                featured: customData.featured.map((card, idx) => ({
                  title: card.title || existing?.featured[idx]?.title || "",
                  href: card.href || existing?.featured[idx]?.href || item.url,
                  image: card.image || existing?.featured[idx]?.image || "",
                })),
              };
              menus[itemSlug] = updatedMenu;
              menus[item.id] = updatedMenu;
              if (item.categoryId) menus[item.categoryId] = updatedMenu;
              if (urlCatSlug) menus[urlCatSlug] = updatedMenu;
            }
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
      const visibleItems = configuredNavItems.filter(
        (item) =>
          item.label.toLowerCase() !== "all categories" && item.isActive && item.visibleDesktop,
      );
      const hasDealsLabel = visibleItems.some(
        (item) => item.url === ROUTES.deals && item.label.trim().toLowerCase() === "deals",
      );

      return visibleItems
        .filter(
          (item) =>
            !(
              hasDealsLabel &&
              item.url === ROUTES.deals &&
              item.label.trim().toLowerCase() === "today deals"
            ),
        )
        .map((item) => {
          let slug: string | undefined = undefined;
          if (item.url.includes("/brands") || item.label.toLowerCase() === "brands") {
            slug = resolvedBrandsMegaMenu ? BRANDS_MEGA_MENU_SLUG : undefined;
          } else {
            const urlCatSlug = extractCategorySlugFromUrl(item.url);
            const match = effectiveCategoryMenus.find(
              (m) =>
                (urlCatSlug && m.slug === urlCatSlug) ||
                (item.categoryId &&
                  (m.slug === item.categoryId ||
                    m.slug === item.categoryId.replace(/^cat[-_]/, "") ||
                    item.categoryId === `cat_${m.slug}` ||
                    item.categoryId === `cat-${m.slug}`)) ||
                item.label.trim().toLowerCase() === m.name.trim().toLowerCase() ||
                (urlCatSlug && (m.slug.includes(urlCatSlug) || urlCatSlug.includes(m.slug))) ||
                m.href === item.url ||
                m.slug === item.url.replace(/^\//, "").split("?")[0],
            );
            if (match) {
              slug = match.slug;
            } else if (item.itemType === "dropdown" || item.itemType === "mega_menu") {
              slug =
                urlCatSlug ||
                (item.categoryId ? item.categoryId.replace(/^cat[-_]/, "") : undefined) ||
                item.categoryId ||
                extractSlugFromUrl(item.url) ||
                slugify(item.label) ||
                item.id;
            }
          }

          const hasDropdown =
            item.itemType === "dropdown" || item.itemType === "mega_menu" || Boolean(slug);

          if (hasDropdown && !slug) {
            slug =
              item.categoryId ||
              extractCategorySlugFromUrl(item.url) ||
              extractSlugFromUrl(item.url) ||
              slugify(item.label) ||
              item.id;
          }

          return {
            key: item.id,
            label: item.label,
            href: item.url,
            slug,
            hasDropdown,
            badge: item.badgeText,
            categoryId: item.categoryId,
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
              aria-controls="all-categories-mega-menu"
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
            {resolvedNavItems.map((item, index) => (
              <div
                key={`${item.key}-${index}`}
                className={`site-header__nav-item-unit${item.active ? " is-active" : ""}${hoveredKey === item.key ? " is-hovered" : ""}`}
                role="listitem"
                onMouseEnter={() => {
                  setHoveredKey(item.key);
                  if (item.hasDropdown) {
                    const resolvedSlug =
                      (item.slug && megaMenuBySlug[item.slug] ? item.slug : null) ||
                      (item.categoryId && megaMenuBySlug[item.categoryId]
                        ? item.categoryId
                        : null) ||
                      (item.key && megaMenuBySlug[item.key] ? item.key : null) ||
                      item.slug ||
                      item.key;

                    if (resolvedSlug && megaMenuBySlug[resolvedSlug]) {
                      openMenu(resolvedSlug);
                    } else {
                      const fallback = Object.values(megaMenuBySlug).find(
                        (m) =>
                          m.name.toLowerCase() === item.label.toLowerCase() ||
                          (item.href && m.href === item.href),
                      );
                      if (fallback) {
                        openMenu(fallback.slug);
                      } else {
                        setActiveSlug(null);
                        setAllCategoriesOpen(false);
                      }
                    }
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
            menus={effectiveCategoryMenus}
            onClose={() => setAllCategoriesOpen(false)}
            onNavigate={handleNavigate}
          />
          <HeaderMegaMenu menu={activeMenu} open={Boolean(activeMenu)} />
        </div>
      </div>
    </nav>
  );
}

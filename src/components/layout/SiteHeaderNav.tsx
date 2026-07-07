"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { HEADER_MEGA_MENUS, MEGA_MENU_BY_SLUG } from "@/data/headerMegaMenu";
import { ROUTES } from "@/lib/routes";
import HeaderMegaMenu from "@/components/layout/HeaderMegaMenu";
import GooeyLinkupFilter from "@/components/ui/GooeyLinkupFilter";
import { useCompactHeaderNav } from "@/hooks/useCompactHeaderNav";
import { useAuthStore } from "@/store/authStore";
import { useShallow } from "zustand/react/shallow";

interface SiteHeaderNavProps {
  onNavigate?: () => void;
  onMegaMenuOpenChange?: (open: boolean) => void;
  mobileOpen?: boolean;
}

const HOVER_CLOSE_DELAY_MS = 120;

interface NavGooItem {
  key: string;
  label: string;
  href: string;
  slug?: string;
  accent?: boolean;
  active?: boolean;
}

const MOBILE_EXTRA_LINKS = [
  {
    key: "deals",
    label: "Deals",
    href: `${ROUTES.searchResults}?q=deals`,
    accent: true,
  },
  {
    key: "guides",
    label: "Guides",
    href: ROUTES.blog,
  },
  {
    key: "gp9",
    label: "Grand Piano",
    href: ROUTES.gp9,
  },
] as const;

export default function SiteHeaderNav({
  onNavigate,
  onMegaMenuOpenChange,
  mobileOpen = false,
}: SiteHeaderNavProps) {
  const pathname = usePathname() ?? "";
  const compactNav = useCompactHeaderNav();
  const { isAuthenticated, isInitialized } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    }))
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [scrollable, setScrollable] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navShellRef = useRef<HTMLDivElement>(null);

  const navItems: NavGooItem[] = [
    ...HEADER_MEGA_MENUS.map((menu) => ({
      key: menu.slug,
      label: menu.name,
      href: menu.href,
      slug: menu.slug,
      active: activeSlug === menu.slug,
    })),
    {
      key: "deals",
      label: "Deals",
      href: `${ROUTES.searchResults}?q=deals`,
      accent: true,
    },
    {
      key: "guides",
      label: "Guides",
      href: ROUTES.blog,
    },
    {
      key: "gp9",
      label: "Grand Piano",
      href: ROUTES.gp9,
      active:
        pathname === ROUTES.gp9 || pathname.startsWith(`${ROUTES.gp9}/`),
    },
  ];

  useEffect(() => {
    if (compactNav) return;
    const el = navShellRef.current?.querySelector(".site-header__nav-inner");
    if (!el) return;

    const check = () => setScrollable(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [compactNav]);

  useEffect(() => {
    setExpandedSlug(null);
    setActiveSlug(null);
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
      setActiveSlug(slug);
    },
    [clearCloseTimer]
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setActiveSlug(null), HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const handleNavigate = useCallback(() => {
    setActiveSlug(null);
    setExpandedSlug(null);
    setHoveredKey(null);
    onNavigate?.();
  }, [onNavigate]);

  const toggleExpanded = useCallback((slug: string) => {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }, []);

  const activeMenu = activeSlug ? MEGA_MENU_BY_SLUG[activeSlug] ?? null : null;

  useEffect(() => {
    onMegaMenuOpenChange?.(Boolean(activeSlug));
  }, [activeSlug, onMegaMenuOpenChange]);

  const hoveredIndex = hoveredKey
    ? navItems.findIndex((item) => item.key === hoveredKey)
    : -1;

  const shouldPull = (index: number) => {
    if (hoveredIndex < 0 || index <= 0) return false;
    return index === hoveredIndex || index === hoveredIndex + 1;
  };

  const blobClass = (item: NavGooItem) => {
    const classes = ["gooey-linkup__blob"];
    if (item.accent) classes.push("gooey-linkup__blob--accent");
    if (item.active) classes.push("gooey-linkup__blob--active");
    if (hoveredKey === item.key) classes.push("gooey-linkup__blob--hovered");
    return classes.join(" ");
  };

  const hitClass = (item: NavGooItem) => {
    const classes = ["gooey-linkup__hit"];
    if (item.accent) classes.push("gooey-linkup__hit--accent");
    if (item.active) classes.push("gooey-linkup__hit--active");
    return classes.join(" ");
  };

  return (
    <nav
      id="site-header-nav"
      className="site-header__nav assets-site-header__nav"
      aria-label="Shop categories"
      aria-hidden={compactNav && !mobileOpen ? true : undefined}
      onMouseLeave={
        compactNav
          ? undefined
          : () => {
              scheduleClose();
              setHoveredKey(null);
            }
      }
    >
      {compactNav ? (
        <div className="site-header__mobile-nav">
          {HEADER_MEGA_MENUS.map((menu) => {
            const expanded = expandedSlug === menu.slug;
            return (
              <div
                key={menu.slug}
                className={`site-header__mobile-nav-group${expanded ? " is-expanded" : ""}`}
              >
                <div className="site-header__mobile-nav-row">
                  <Link
                    href={menu.href}
                    className="site-header__mobile-nav-link"
                    onClick={handleNavigate}
                  >
                    {menu.name}
                  </Link>
                  <button
                    type="button"
                    className="site-header__mobile-nav-toggle"
                    aria-expanded={expanded}
                    aria-controls={`mobile-nav-panel-${menu.slug}`}
                    aria-label={`${expanded ? "Hide" : "Show"} ${menu.name} subcategories`}
                    onClick={() => toggleExpanded(menu.slug)}
                  >
                    <ChevronDown size={18} aria-hidden />
                  </button>
                </div>
                {expanded ? (
                  <div
                    id={`mobile-nav-panel-${menu.slug}`}
                    className="site-header__mobile-submenu"
                  >
                    {menu.columns.map((column) => (
                      <div key={column.heading} className="site-header__mobile-submenu-section">
                        <p className="site-header__mobile-submenu-heading">{column.heading}</p>
                        <ul className="site-header__mobile-submenu-list">
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="site-header__mobile-submenu-link"
                                onClick={handleNavigate}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {MOBILE_EXTRA_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`site-header__mobile-nav-link site-header__mobile-nav-link--solo${"accent" in link && link.accent ? " site-header__mobile-nav-link--accent" : ""}`}
              onClick={handleNavigate}
            >
              {link.label}
            </Link>
          ))}

          <div className="site-header__mobile-nav-footer">
            {isInitialized && isAuthenticated ? (
              <Link
                href={ROUTES.account}
                className="site-header__mobile-nav-footer-link site-header__mobile-nav-footer-link--primary"
                onClick={handleNavigate}
              >
                My account
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.login}
                  className="site-header__mobile-nav-footer-link site-header__mobile-nav-footer-link--primary"
                  onClick={handleNavigate}
                >
                  Log in
                </Link>
                <Link
                  href={ROUTES.register}
                  className="site-header__mobile-nav-footer-link site-header__mobile-nav-footer-link--secondary"
                  onClick={handleNavigate}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <GooeyLinkupFilter id="gooey-linkup" />
          <div
            ref={navShellRef}
            className={`site-header__nav-shell${scrollable ? " site-header__nav-shell--scrollable" : ""}`}
          >
            <div className="site-header__nav-inner">
              <div
                className="gooey-linkup site-header__nav-gooey"
                role="list"
                onMouseLeave={() => setHoveredKey(null)}
              >
                <div className="gooey-linkup__blobs" aria-hidden>
                  {navItems.map((item, index) => (
                    <span
                      key={item.key}
                      className={blobClass(item)}
                      data-goo-pull={shouldPull(index) ? "" : undefined}
                    >
                      <span className="gooey-linkup__blob-size">{item.label}</span>
                    </span>
                  ))}
                </div>

                <div className="gooey-linkup__hits">
                  {navItems.map((item, index) => (
                    <div
                      key={item.key}
                      className="gooey-linkup__unit"
                      role="listitem"
                      data-goo-pull={shouldPull(index) ? "" : undefined}
                      onMouseEnter={() => {
                        setHoveredKey(item.key);
                        if (item.slug) openMenu(item.slug);
                      }}
                    >
                      <Link
                        href={item.href}
                        className={hitClass(item)}
                        onClick={handleNavigate}
                        aria-expanded={
                          item.slug ? activeSlug === item.slug : undefined
                        }
                        aria-haspopup={item.slug ? "true" : undefined}
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
              <HeaderMegaMenu menu={activeMenu} open={Boolean(activeMenu)} />
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

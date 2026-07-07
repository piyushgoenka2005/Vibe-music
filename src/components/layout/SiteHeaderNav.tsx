"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_MEGA_MENUS, MEGA_MENU_BY_SLUG } from "@/data/headerMegaMenu";
import { ROUTES } from "@/lib/routes";
import HeaderMegaMenu from "@/components/layout/HeaderMegaMenu";
import GooeyLinkupFilter from "@/components/ui/GooeyLinkupFilter";

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

export default function SiteHeaderNav({
  onNavigate,
  onMegaMenuOpenChange,
  mobileOpen = false,
}: SiteHeaderNavProps) {
  const pathname = usePathname() ?? "";
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [megaEnabled, setMegaEnabled] = useState(false);
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
      label: "GP-9",
      href: ROUTES.gp9,
      active:
        pathname === ROUTES.gp9 || pathname.startsWith(`${ROUTES.gp9}/`),
    },
  ];

  useEffect(() => {
    const el = navShellRef.current?.querySelector(".site-header__nav-inner");
    if (el) {
      const check = () => setScrollable(el.scrollWidth > el.clientWidth);
      check();
      const ro = new ResizeObserver(check);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMegaEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(
    (slug: string) => {
      if (!megaEnabled) return;
      clearCloseTimer();
      setActiveSlug(slug);
    },
    [clearCloseTimer, megaEnabled]
  );

  const scheduleClose = useCallback(() => {
    if (!megaEnabled) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setActiveSlug(null), HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer, megaEnabled]);

  const handleNavigate = useCallback(() => {
    setActiveSlug(null);
    setHoveredKey(null);
    onNavigate?.();
  }, [onNavigate]);

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
      className="site-header__nav assets-site-header__nav"
      aria-label="Shop categories"
      aria-hidden={!megaEnabled && !mobileOpen ? true : undefined}
      onMouseLeave={() => {
        scheduleClose();
        setHoveredKey(null);
      }}
    >
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
                      item.slug ? megaEnabled && activeSlug === item.slug : undefined
                    }
                    aria-haspopup={item.slug && megaEnabled ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {megaEnabled ? (
          <div onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
            <HeaderMegaMenu menu={activeMenu} open={Boolean(activeMenu)} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

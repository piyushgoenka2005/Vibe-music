"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HEADER_MEGA_MENUS, MEGA_MENU_BY_SLUG } from "@/data/headerMegaMenu";
import { ROUTES } from "@/lib/routes";
import HeaderMegaMenu from "@/components/layout/HeaderMegaMenu";

interface SiteHeaderNavProps {
  onNavigate?: () => void;
  onMegaMenuOpenChange?: (open: boolean) => void;
}

const HOVER_CLOSE_DELAY_MS = 120;

export default function SiteHeaderNav({
  onNavigate,
  onMegaMenuOpenChange,
}: SiteHeaderNavProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [megaEnabled, setMegaEnabled] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    onNavigate?.();
  }, [onNavigate]);

  const activeMenu = activeSlug ? MEGA_MENU_BY_SLUG[activeSlug] ?? null : null;

  useEffect(() => {
    onMegaMenuOpenChange?.(Boolean(activeSlug));
  }, [activeSlug, onMegaMenuOpenChange]);

  return (
    <nav
      className="site-header__nav assets-site-header__nav"
      aria-label="Shop categories"
      onMouseLeave={scheduleClose}
    >
      <div className="site-header__nav-shell">
        <div className="site-header__nav-inner">
          {HEADER_MEGA_MENUS.map((menu) => (
            <div
              key={menu.slug}
              className="site-header__nav-item"
              onMouseEnter={() => openMenu(menu.slug)}
            >
              <Link
                href={menu.href}
                className={`site-header__nav-link${
                  activeSlug === menu.slug ? " site-header__nav-link--active" : ""
                }`}
                onClick={handleNavigate}
                aria-expanded={megaEnabled && activeSlug === menu.slug}
                aria-haspopup={megaEnabled ? "true" : undefined}
              >
                {menu.name}
              </Link>
            </div>
          ))}

          <Link
            href={`${ROUTES.searchResults}?q=deals`}
            className="site-header__nav-link site-header__nav-link--accent"
            onClick={handleNavigate}
          >
            Deals
          </Link>
          <Link href={ROUTES.blog} className="site-header__nav-link" onClick={handleNavigate}>
            Guides
          </Link>
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

"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { HEADER_MEGA_MENUS, type MegaMenuItem } from "@/data/headerMegaMenu";
import { ROUTES } from "@/lib/routes";
import { isHeaderNavItemActive } from "@/lib/navigation/headerNavActive";
import { resolveBrandsMegaMenu } from "@/lib/navigation/buildBrandsMegaMenu";
import { useAuthStore } from "@/store/authStore";
import { useShallow } from "zustand/react/shallow";

const MOBILE_EXTRA_LINKS = [
  {
    key: "deals",
    label: "Deals",
    href: ROUTES.deals,
  },
  {
    key: "programs",
    label: "Programs",
    href: ROUTES.programs,
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

interface SiteHeaderMobileNavProps {
  onNavigate?: () => void;
  brandsMegaMenu?: MegaMenuItem | null;
}

function renderMegaMenuGroup(
  menu: MegaMenuItem,
  options: {
    expandedSlug: string | null;
    pathname: string;
    searchCategory: string | null;
    searchQuery: string | null;
    toggleExpanded: (slug: string) => void;
    handleNavigate: () => void;
  },
) {
  const { expandedSlug, pathname, searchCategory, searchQuery, toggleExpanded, handleNavigate } =
    options;
  const expanded = expandedSlug === menu.slug;

  return (
    <div
      key={menu.slug}
      className={`site-header__mobile-nav-group${expanded ? " is-expanded" : ""}`}
    >
      <div className="site-header__mobile-nav-row">
        <Link
          href={menu.href}
          className={`site-header__mobile-nav-link${
            isHeaderNavItemActive({
              key: menu.slug,
              href: menu.href,
              slug: menu.slug,
              pathname,
              searchCategory,
              searchQuery,
            })
              ? " site-header__mobile-nav-link--active"
              : ""
          }`}
          onClick={handleNavigate}
          aria-current={
            isHeaderNavItemActive({
              key: menu.slug,
              href: menu.href,
              slug: menu.slug,
              pathname,
              searchCategory,
              searchQuery,
            })
              ? "page"
              : undefined
          }
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
        <div id={`mobile-nav-panel-${menu.slug}`} className="site-header__mobile-submenu">
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
}

export default function SiteHeaderMobileNav({
  onNavigate,
  brandsMegaMenu = null,
}: SiteHeaderMobileNavProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const { isAuthenticated, isInitialized } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    })),
  );
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [expandedForPath, setExpandedForPath] = useState(pathname);
  if (expandedForPath !== pathname) {
    setExpandedForPath(pathname);
    setExpandedSlug(null);
  }

  const handleNavigate = useCallback(() => {
    setExpandedSlug(null);
    onNavigate?.();
  }, [onNavigate]);

  const toggleExpanded = useCallback((slug: string) => {
    setExpandedSlug((current) => (current === slug ? null : slug));
  }, []);

  const accountHref = isInitialized && isAuthenticated ? ROUTES.account : ROUTES.login;
  const resolvedBrandsMegaMenu = useMemo(
    () => resolveBrandsMegaMenu(brandsMegaMenu),
    [brandsMegaMenu],
  );

  return (
    <div className="site-header__mobile-nav">
      <div className="site-header__mobile-nav-scroll">
        {resolvedBrandsMegaMenu
          ? renderMegaMenuGroup(resolvedBrandsMegaMenu, {
              expandedSlug,
              pathname,
              searchCategory,
              searchQuery,
              toggleExpanded,
              handleNavigate,
            })
          : null}

        {HEADER_MEGA_MENUS.map((menu) =>
          renderMegaMenuGroup(menu, {
            expandedSlug,
            pathname,
            searchCategory,
            searchQuery,
            toggleExpanded,
            handleNavigate,
          }),
        )}

        <div className="site-header__mobile-nav-extras">
          {MOBILE_EXTRA_LINKS.map((link) => {
            const active = isHeaderNavItemActive({
              key: link.key,
              href: link.href,
              pathname,
              searchCategory,
              searchQuery,
            });
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`site-header__mobile-nav-link site-header__mobile-nav-link--solo${
                  active ? " site-header__mobile-nav-link--active" : ""
                }`}
                onClick={handleNavigate}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="site-header__mobile-nav-footer">
        <Link
          href={accountHref}
          className="site-header__mobile-nav-footer-link site-header__mobile-nav-footer-link--primary"
          onClick={handleNavigate}
        >
          My account
        </Link>
      </div>
    </div>
  );
}

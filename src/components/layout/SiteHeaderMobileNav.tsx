"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { HEADER_MEGA_MENUS } from "@/data/headerMegaMenu";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { useShallow } from "zustand/react/shallow";

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

interface SiteHeaderMobileNavProps {
  onNavigate?: () => void;
}

export default function SiteHeaderMobileNav({ onNavigate }: SiteHeaderMobileNavProps) {
  const pathname = usePathname() ?? "";
  const { isAuthenticated, isInitialized } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
    }))
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

  const accountHref =
    isInitialized && isAuthenticated ? ROUTES.account : ROUTES.login;

  return (
    <div className="site-header__mobile-nav">
      <div className="site-header__mobile-nav-scroll">
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
                    <div
                      key={column.heading}
                      className="site-header__mobile-submenu-section"
                    >
                      <p className="site-header__mobile-submenu-heading">
                        {column.heading}
                      </p>
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

        <div className="site-header__mobile-nav-extras">
          {MOBILE_EXTRA_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`site-header__mobile-nav-link site-header__mobile-nav-link--solo${
                "accent" in link && link.accent
                  ? " site-header__mobile-nav-link--accent"
                  : ""
              }`}
              onClick={handleNavigate}
            >
              {link.label}
            </Link>
          ))}
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

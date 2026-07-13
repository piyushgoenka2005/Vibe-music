"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { GP9_BASE, gp9Path } from "@/gp9/lib/base-path";
import { cn } from "@/gp9/lib/utils";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

/** Full set — used in the mobile drawer. */
const navLinks = [
  { href: `${GP9_BASE}/#about`, label: "About" },
  { href: `${GP9_BASE}/#products`, label: "Models" },
  { href: `${GP9_BASE}/#technology`, label: "Technology" },
  { href: `${GP9_BASE}/#gallery`, label: "Gallery" },
  { href: `${GP9_BASE}/#midlife`, label: "Sound Lab" },
  { href: `${GP9_BASE}/#spinner`, label: "360°" },
  { href: `${GP9_BASE}/#experience`, label: "Explore" },
  { href: `${GP9_BASE}/#series`, label: "Series" },
  { href: `${GP9_BASE}/#specs`, label: "Specs" },
];

/** Compact desktop set so links never collide with the brand / CTAs. */
const desktopNavLinks = [
  { href: `${GP9_BASE}/#products`, label: "Models" },
  { href: `${GP9_BASE}/#technology`, label: "Technology" },
  { href: `${GP9_BASE}/#gallery`, label: "Gallery" },
  { href: `${GP9_BASE}/#midlife`, label: "Sound Lab" },
  { href: `${GP9_BASE}/#spinner`, label: "360°" },
  { href: `${GP9_BASE}/#experience`, label: "Explore", xlOnly: true },
  { href: `${GP9_BASE}/#specs`, label: "Specs", xlOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const isShowcase = pathname.startsWith(`${GP9_BASE}/showcase`);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    return subscribeScroll(handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const linkClass = (scrolled: boolean) =>
    cn(
      "group inline-flex items-center gap-1 whitespace-nowrap text-[11px] transition-colors xl:text-xs 2xl:text-sm",
      scrolled
        ? "text-muted-foreground hover:text-foreground"
        : "text-white/70 hover:text-white"
    );

  return (
    <header
      className={cn(
        "fixed top-2 left-1/2 z-50 w-[calc(100%-2.4rem)] -translate-x-1/2 transition-all duration-300 sm:top-3 sm:w-[calc(100%-2rem)] sm:max-w-6xl lg:top-4 lg:max-w-7xl",
        isScrolled || isMenuOpen
          ? "rounded-full bg-background/85 shadow-sm backdrop-blur-md"
          : "bg-transparent max-lg:rounded-full max-lg:bg-background/85 max-lg:shadow-sm max-lg:backdrop-blur-md max-lg:[box-shadow:rgba(14,63,126,0.04)_0px_0px_0px_1px,rgba(42,51,69,0.04)_0px_1px_1px_-0.5px]",
        isMenuOpen && "rounded-xl bg-background/95 backdrop-blur-md sm:rounded-2xl lg:rounded-3xl"
      )}
      style={{
        boxShadow:
          isScrolled || isMenuOpen
            ? "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px"
            : undefined,
      }}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-1.5 sm:gap-4 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5">
        <Link
          href={gp9Path()}
          className={cn(
            "relative z-10 shrink-0 whitespace-nowrap text-sm font-medium tracking-tight transition-colors duration-300 lg:text-base",
            isScrolled || isMenuOpen
              ? "text-foreground"
              : "text-foreground lg:text-white"
          )}
        >
          <span className="lg:hidden">GP-9</span>
          <span className="hidden lg:inline">Grand Piano</span>
        </Link>

        <nav
          className="hidden min-w-0 items-center justify-center gap-2.5 overflow-hidden xl:gap-4 lg:flex"
          aria-label="GP-9 sections"
        >
          {desktopNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                linkClass(isScrolled),
                link.xlOnly && "hidden xl:inline-flex"
              )}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
          <div
            className={cn(
              "gp9-header-mode-toggle",
              !(isScrolled || isMenuOpen) && !isShowcase && "gp9-header-mode-toggle--light"
            )}
            role="group"
            aria-label="Experience mode"
          >
            <Link
              href={gp9Path("/#midlife")}
              className={cn("gp9-header-mode-btn", !isShowcase && "gp9-header-mode-btn--active")}
            >
              Play
            </Link>
            <Link
              href={gp9Path("/showcase")}
              className={cn("gp9-header-mode-btn", isShowcase && "gp9-header-mode-btn--active")}
            >
              Showcase
            </Link>
          </div>
          <Link
            href="#dealers"
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all xl:gap-2 xl:px-4",
              isScrolled
                ? "bg-foreground text-background hover:opacity-80"
                : "bg-white text-foreground hover:bg-white/90"
            )}
          >
            <span className="whitespace-nowrap">Where to Buy</span>
            <ArrowUpRight
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "col-start-3 flex h-8 w-8 shrink-0 items-center justify-center justify-self-end transition-colors lg:hidden",
            isScrolled || isMenuOpen ? "text-foreground" : "text-foreground"
          )}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border px-2.5 pb-4 pt-2.5 sm:px-4 sm:pb-6 sm:pt-4 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted sm:px-3 sm:py-2.5 sm:text-base"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{link.label}</span>
                <NavArrowIcon size="sm" />
              </Link>
            ))}
            <div
              className="gp9-header-mode-toggle my-2 w-full justify-center sm:my-3"
              role="group"
              aria-label="Experience mode"
            >
              <Link
                href={gp9Path("/#midlife")}
                className={cn("gp9-header-mode-btn flex-1 text-center", !isShowcase && "gp9-header-mode-btn--active")}
                onClick={() => setIsMenuOpen(false)}
              >
                Play
              </Link>
              <Link
                href={gp9Path("/showcase")}
                className={cn("gp9-header-mode-btn flex-1 text-center", isShowcase && "gp9-header-mode-btn--active")}
                onClick={() => setIsMenuOpen(false)}
              >
                Showcase
              </Link>
            </div>
            <Link
              href="#dealers"
              className="group mt-2 flex items-center justify-between rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background sm:mt-3 sm:px-5 sm:py-2.5 sm:text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Where to Buy</span>
              <NavArrowIcon className="border-white/20 bg-white/10 text-background group-hover:bg-background group-hover:text-foreground" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

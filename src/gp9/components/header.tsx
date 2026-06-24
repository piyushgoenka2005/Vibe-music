"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { GP9_BASE, gp9Path } from "@/gp9/lib/base-path";
import { cn } from "@/gp9/lib/utils";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#products", label: "Models" },
  { href: "#technology", label: "Technology" },
  { href: "#gallery", label: "Gallery" },
  { href: "#midlife", label: "Sound Lab" },
  { href: "#spinner", label: "360°" },
  { href: "#experience", label: "3D" },
  { href: "#series", label: "Series" },
  { href: "#specs", label: "Specs" },
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
      "group inline-flex items-center gap-1.5 whitespace-nowrap text-xs transition-colors lg:text-sm",
      scrolled
        ? "text-muted-foreground hover:text-foreground"
        : "text-white/70 hover:text-white"
    );

  return (
    <header
      className={cn(
        "fixed top-2 left-1/2 z-50 w-[calc(100%-2.4rem)] -translate-x-1/2 transition-all duration-300 sm:top-3 sm:w-[calc(100%-2rem)] sm:max-w-6xl lg:top-4",
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
      <div className="flex items-center justify-between gap-2 px-4 py-1 sm:gap-3 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5">
        <Link
          href={gp9Path()}
          className={cn(
            "shrink-0 text-xs font-medium tracking-tight transition-colors duration-300 sm:text-sm lg:text-lg",
            isScrolled || isMenuOpen
              ? "text-foreground"
              : "text-foreground lg:text-white"
          )}
        >
          Grand Piano
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(isScrolled)}>
              <span>{link.label}</span>
              <ArrowUpRight
                aria-hidden
                className={cn(
                  "h-3 w-3 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100",
                  isScrolled ? "text-foreground" : "text-white"
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
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
              "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all lg:text-sm",
              isScrolled
                ? "bg-foreground text-background hover:opacity-80"
                : "bg-white text-foreground hover:bg-white/90"
            )}
          >
            <span>Where to Buy</span>
            <ArrowUpRight
              aria-hidden
              className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center transition-colors lg:hidden",
            isScrolled || isMenuOpen ? "text-foreground" : "text-foreground lg:text-white"
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

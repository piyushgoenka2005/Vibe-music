"use client";

import Link from "next/link";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { gp9Path } from "@/gp9/lib/base-path";

const footerLinks = {
  explore: [
    { label: "Models", href: "#products" },
    { label: "Technology", href: "#technology" },
    { label: "Gallery", href: "#gallery" },
    { label: "Sound Lab", href: "#midlife" },
    { label: "360° View", href: "#spinner" },
    { label: "3D Experience", href: "#experience" },
    { label: "GP-9M", href: "#moving-keys" },
    { label: "Series", href: "#series" },
    { label: "Specs", href: "#specs" },
  ],
  about: [
    { label: "About", href: "#about" },
    { label: "Specifications", href: "#specs" },
    { label: "Details", href: "https://www.roland.com/global/products/gp-9/", external: true },
    { label: "Where to Buy", href: "#dealers" },
  ],
  service: [
    { label: "Owner's Manual", href: "https://www.roland.com/global/support/manuals/", external: true },
    { label: "Support", href: "https://www.roland.com/global/support/", external: true },
    { label: "Quick Start", href: "https://www.roland.com/global/products/gp-9/", external: true },
    { label: "Roland Cloud", href: "https://www.roland.com/global/promos/roland_cloud/", external: true },
  ],
};

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/rolandglobal/" },
  { label: "YouTube", href: "https://www.youtube.com/user/RolandChannel" },
  { label: "Roland", href: "https://www.roland.com/global/" },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
      {children}
    </h4>
  );
}

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 -mx-2 text-[13px] leading-snug text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground"
    >
      <span className="min-w-0">{label}</span>
      <NavArrowIcon
        size="sm"
        className="h-6 w-6 shrink-0 opacity-40 transition-all group-hover:opacity-100"
      />
    </Link>
  );
}

export function FooterSection() {
  return (
    <footer className="w-full bg-gradient-to-b from-muted/25 to-background">
      <div className="border-t border-border/80 px-4 py-9 sm:px-6 sm:py-12 md:px-10 md:py-16 lg:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-10">
          <div className="col-span-2 rounded-2xl border border-border/50 bg-background/90 p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)] backdrop-blur-sm sm:p-6 lg:col-span-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
              Roland GP-9
            </p>
            <Link
              href={gp9Path()}
              className="mt-2 inline-block text-2xl font-medium tracking-tight sm:text-[1.75rem] lg:text-lg"
            >
              <span className="bg-gradient-to-r from-primary via-primary/90 to-muted-foreground bg-clip-text text-transparent">
                Grand Piano
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:max-w-xs">
              Modern elegance, authentic touch, and immersive sound for the home.
            </p>
          </div>

          <div className="min-w-0 self-start rounded-2xl border border-border/50 bg-background/60 p-4 sm:p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
            <FooterHeading>Explore</FooterHeading>
            <ul className="space-y-0.5">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-border/50 bg-background/60 p-4 sm:gap-8 sm:p-5 lg:contents lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
            <div className="min-w-0">
              <FooterHeading>About</FooterHeading>
              <ul className="space-y-0.5">
                {footerLinks.about.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} external={link.external} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 border-t border-border/40 pt-6 sm:pt-8 lg:border-0 lg:pt-0">
              <FooterHeading>Service</FooterHeading>
              <ul className="space-y-0.5">
                {footerLinks.service.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} external={link.external} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/80 bg-muted/20 px-4 py-5 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-center text-[11px] tracking-wide text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} Roland. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-foreground/15 hover:text-foreground"
              >
                <span>{link.label}</span>
                <NavArrowIcon
                  size="sm"
                  className="h-5 w-5 opacity-50 group-hover:opacity-100"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

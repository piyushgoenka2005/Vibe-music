"use client";

import Link from "next/link";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";

export function CtaSection() {
  return (
    <section id="dealers" className="w-full scroll-mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-16">
        <ScrollReveal variant="blur">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-primary-foreground/50">Where to buy</p>
            <h2 className="mt-6 font-display text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
              Experience GP-9 in person.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-primary-foreground/70 md:text-base">
              Find an authorized Roland dealer near you to play the GP-9, compare finishes,
              and hear Piano Reality Projection in your own space.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="https://www.roland.com/global/dealers/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-primary-foreground px-6 py-3.5 text-sm font-medium text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:opacity-95"
              >
                <span className="whitespace-nowrap">Find a dealer</span>
                <NavArrowIcon
                  size="sm"
                  className="border-primary/15 bg-primary/10 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                />
              </Link>
              <Link
                href="https://www.roland.com/global/products/gp-9/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-primary-foreground px-8 py-4 text-base font-medium text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:opacity-95"
              >
                <span className="whitespace-nowrap">Official product page</span>
                <NavArrowIcon
                  size="sm"
                  className="border-primary/15 bg-primary/10 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

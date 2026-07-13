"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Gp9Image as Image } from "@/gp9/components/gp9-image";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { gp9Path } from "@/gp9/lib/base-path";

const LOCAL_GP9 = "/images/products/roland-gp9-front.webp";

export function InteractivePianoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="border-t border-border bg-background">
      <SectionHeading
        label="Explore"
        title="Play it. Showcase it."
        subtitle="Jump into the Sound Lab keyboard or the cinematic 3D showcase — both powered by the live GP-9 experience on this site."
        className="py-20 md:py-28 lg:pb-12"
      />

      <ScrollReveal variant="scale" className="mx-6 md:mx-12 lg:mx-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
            {mounted ? (
              <Image
                src={LOCAL_GP9}
                alt="Roland GP-9 digital grand piano"
                fill
                className="object-contain bg-gradient-to-b from-secondary to-muted p-6 md:p-10"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Loading…
                </p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <p className="max-w-md text-sm text-white/85 md:text-base">
                Interactive piano and cinematic camera moves — built into Vibe Music.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={gp9Path("/#midlife")}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-white/90"
                >
                  Open Sound Lab
                  <NavArrowIcon size="sm" />
                </Link>
                <Link
                  href={gp9Path("/showcase")}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Cinematic Showcase
                  <NavArrowIcon
                    size="sm"
                    className="border-white/20 bg-white/10 text-white"
                  />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-background px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Sound Lab · playable keys · Showcase · scroll-driven 3D
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

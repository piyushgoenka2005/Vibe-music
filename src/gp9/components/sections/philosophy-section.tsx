"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { TiltCard } from "@/gp9/components/ui/tilt-card";
import { cn } from "@/gp9/lib/utils";
import { FINISHES, type FinishKey } from "@/gp9/lib/gp9-assets";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [ebonyTranslateX, setEbonyTranslateX] = useState(-100);
  const [whiteTranslateX, setWhiteTranslateX] = useState(100);
  const [titleBlend, setTitleBlend] = useState(0);
  const [activeFinish, setActiveFinish] = useState<FinishKey>("ebony");
  const rafRef = useRef<number | null>(null);

  const updateTransforms = useCallback(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const scrollableRange = sectionRef.current.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / scrollableRange));
    setEbonyTranslateX((1 - progress) * -100);
    setWhiteTranslateX((1 - progress) * 100);
    setTitleBlend(progress);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTransforms);
    };
    handleScroll();
    const unsubscribe = subscribeScroll(handleScroll);
    return () => {
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateTransforms]);

  const cards: { key: FinishKey; translateX: number }[] = [
    { key: "ebony", translateX: ebonyTranslateX },
    { key: "white", translateX: whiteTranslateX },
  ];

  return (
    <section id="products" className="relative w-full scroll-mt-24 overflow-x-clip bg-background">
      <SectionHeading
        label="Models"
        title="Two finishes. One presence."
        subtitle="Polished ebony and polished white — each crafted to anchor a room with concert-hall elegance."
        className="pb-8 pt-8 md:pb-12"
      />

      <div className="mb-8 flex justify-center gap-3 px-6">
        {(Object.keys(FINISHES) as FinishKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFinish(key)}
            className={cn(
              "cursor-target rounded-full border px-5 py-2 text-xs font-medium uppercase tracking-[0.25em] transition-all",
              activeFinish === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            )}
            data-cursor-target
          >
            {FINISHES[key].shortLabel}
          </button>
        ))}
      </div>

      <div ref={sectionRef} className="relative" style={{ height: "150vh" }}>
        <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden grain-overlay">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
              <h2
                className="px-6 text-center font-display text-[11vw] font-medium leading-[0.95] tracking-tighter md:text-[9vw] lg:text-[7vw]"
                style={{
                  color: `color-mix(in srgb, #1253ED ${Math.max(0, 100 - titleBlend * 100)}%, #e4e4e7)`,
                }}
              >
                Ebony &amp; White
              </h2>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 px-6 md:grid-cols-2 md:px-12 lg:px-20">
              {cards.map(({ key, translateX }) => (
                <TiltCard key={key}>
                  <div
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-2xl card-shine card-border-reveal cursor-target transition-all duration-500",
                      activeFinish === key ? "ring-2 ring-foreground/20" : "md:opacity-100 opacity-80"
                    )}
                    data-cursor-target
                    style={{
                      transform: `translate3d(${translateX}%, 0, 0)`,
                      WebkitTransform: `translate3d(${translateX}%, 0, 0)`,
                    }}
                  >
                    <Image
                      src={FINISHES[key].picker}
                      alt={`Roland GP-9 in ${FINISHES[key].label}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Finish</p>
                        <p className="mt-1 text-xl font-medium text-white">{FINISHES[key].label}</p>
                      </div>
                      <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                        GP-9
                      </span>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-14 sm:px-6 md:px-10 md:py-20 lg:px-16 lg:py-24">
        <ScrollReveal variant="scale">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Grand design language</p>
            <p className="mt-8 font-display text-2xl leading-relaxed text-muted-foreground md:text-3xl">
              Sculpted lines, a high-gloss cabinet, and a lid that opens like a true concert grand —
              the GP-9 transforms any room into a performance space.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

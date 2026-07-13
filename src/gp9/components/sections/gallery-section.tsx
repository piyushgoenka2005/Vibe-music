"use client";

import { Gp9Image as Image } from "@/gp9/components/gp9-image";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SectionHeading } from "@/gp9/components/ui/section-heading";
import { Dialog, DialogContent, DialogTitle } from "@/gp9/components/ui/dialog";
import { cn } from "@/gp9/lib/utils";
import { FINISHES, ROLAND_GALLERY, type FinishKey } from "@/gp9/lib/gp9-assets";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

const GALLERY_SHOTS = [
  { name: "angle_open_gal.jpg", caption: "Lid open", alt: "GP-9 - lid open", shared: false },
  { name: "angle_closed_gal.jpg", caption: "Lid closed", alt: "GP-9 - lid closed", shared: false },
  { name: "angle_side_gal.jpg", caption: "Side profile", alt: "GP-9 - side angle", shared: false },
  { name: "top_angle_gal.jpg", caption: "Top view", alt: "GP-9 - top angle", shared: false },
  { name: "back_angle_gal.jpg", caption: "Rear detail", alt: "GP-9 - back angle", shared: false },
  { name: "panel_1_gal.jpg", caption: "Touch panel", alt: "GP-9 - smart touch panel", shared: true },
  { name: "ipad_1_gal.jpg", caption: "Piano app", alt: "GP-9 - Roland Piano App", shared: true },
  { name: "casters_gal.jpg", caption: "Casters", alt: "GP-9 - integrated casters", shared: true },
];

export function GallerySection() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sectionHeight, setSectionHeight] = useState("100vh");
  const [translateX, setTranslateX] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFinish, setActiveFinish] = useState<FinishKey>("ebony");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const images = useMemo(
    () =>
      GALLERY_SHOTS.map((shot) => {
        const prefix = shot.shared ? "gp-9" : FINISHES[activeFinish].galleryPrefix;
        const src = `${ROLAND_GALLERY}/${prefix}_${shot.name}`;
        const ebonySrc = `${ROLAND_GALLERY}/gp-9_${shot.name}`;
        return { ...shot, src, ebonySrc };
      }),
    [activeFinish]
  );

  useEffect(() => {
    const calculateHeight = () => {
      if (!containerRef.current) return;
      const totalHeight = window.innerHeight + (containerRef.current.scrollWidth - window.innerWidth);
      setSectionHeight(`${totalHeight}px`);
    };
    const timer = setTimeout(calculateHeight, 100);
    window.addEventListener("resize", calculateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
    };
  }, [images]);

  const updateTransform = useCallback(() => {
    if (!galleryRef.current || !containerRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const totalScrollDistance = containerRef.current.scrollWidth - window.innerWidth;
    const progress = totalScrollDistance > 0 ? Math.min(1, Math.max(0, -rect.top) / totalScrollDistance) : 0;
    setScrollProgress(progress);
    setTranslateX(progress * -totalScrollDistance);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTransform);
    };
    handleScroll();
    const unsubscribe = subscribeScroll(handleScroll);
    return () => {
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateTransform, images]);

  const activeIndex = Math.min(images.length, Math.ceil(scrollProgress * images.length) + 1);

  return (
    <section id="gallery" className="relative w-full scroll-mt-24 overflow-x-clip bg-background">
      <SectionHeading
        label="Gallery"
        title="Every angle, considered."
        subtitle="Scroll through the GP-9 — from cabinet silhouette to speaker array and smart controls."
        className="pb-8 pt-24 md:pt-32"
      />

      <div className="mb-8 flex flex-col items-center justify-between gap-4 px-6 sm:flex-row md:px-12 lg:px-20">
        <div className="flex gap-3">
          {(Object.keys(FINISHES) as FinishKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFinish(key)}
              className={cn(
                "cursor-target rounded-full border px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.25em] transition-all",
                activeFinish === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary"
              )}
              data-cursor-target
            >
              {FINISHES[key].shortLabel}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {String(activeIndex).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </p>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-border md:w-48">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
        </div>
      </div>

      <div ref={galleryRef} className="relative" style={{ height: sectionHeight }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="flex h-full items-center">
            <div
              ref={containerRef}
              className="flex gap-6 px-6"
              style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
            >
              {images.map((image, index) => {
                const cardProgress = Math.abs(scrollProgress * (images.length - 1) - index);
                return (
                  <button
                    key={`${activeFinish}-${index}`}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="group relative h-[70vh] w-[85vw] flex-shrink-0 overflow-hidden rounded-2xl text-left md:w-[60vw] lg:w-[45vw] card-shine card-border-reveal cursor-target"
                    data-cursor-target
                    style={{
                      transform: `scale(${Math.max(0.88, 1 - cardProgress * 0.06)})`,
                      opacity: Math.max(0.5, 1 - cardProgress * 0.25),
                      transition: "transform 0.4s ease, opacity 0.4s ease",
                    }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority={index < 3}
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.src !== image.ebonySrc) {
                          img.src = image.ebonySrc;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full p-6 transition-transform duration-500 group-hover:translate-y-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">{String(index + 1).padStart(2, "0")}</p>
                      <p className="mt-1 text-lg font-medium text-white">{image.caption}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open: boolean) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl border-none bg-black/95 p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {lightboxIndex !== null ? images[lightboxIndex]?.caption : "Gallery"}
          </DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
              <Image src={images[lightboxIndex].src} alt={images[lightboxIndex].alt} fill className="object-contain" />
              <div className="absolute bottom-4 left-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{FINISHES[activeFinish].label}</p>
                <p className="mt-1 text-lg font-medium text-white">{images[lightboxIndex].caption}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

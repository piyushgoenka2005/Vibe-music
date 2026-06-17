"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LazyVideo } from "@/gp9/components/ui/lazy-video";
import { GP9_VIDEOS, ROLAND_GP9 } from "@/gp9/lib/gp9-assets";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

const word = "Grand Piano";

const sideImages = [
  {
    src: `${ROLAND_GP9}/gp-9_elegance.jpg`,
    alt: "GP-9 Digital Piano - Modern Elegance",
    position: "left",
    span: 1,
  },
  {
    src: `${ROLAND_GP9}/gp-9_elegance2.jpg`,
    alt: "GP-9 Digital Piano - Elegant curves and high-gloss finish",
    position: "left",
    span: 1,
  },
  {
    src: `${ROLAND_GP9}/gp_series_modern_elegance.jpg`,
    alt: "GP Series Grand Pianos - Modern Elegance",
    position: "right",
    span: 1,
  },
  {
    src: `${ROLAND_GP9}/gp_series_immersive_sound.jpg`,
    alt: "GP-9 Digital Piano - Full-Immersion Sound Experience",
    position: "right",
    span: 1,
  },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      
      setScrollProgress(progress);
    };

    handleScroll();
    return subscribeScroll(handleScroll);
  }, []);

  // Text fades out first (0 to 0.2)
  const textOpacity = Math.max(0, 1 - (scrollProgress / 0.2));
  
  // Image transforms start after text fades (0.2 to 1)
  const imageProgress = isCompact ? 0 : Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  
  // Smooth interpolations
  const centerWidth = isCompact ? 100 : 100 - (imageProgress * 58);
  const centerHeight = isCompact ? 100 : 100 - (imageProgress * 30);
  const sideWidth = isCompact ? 0 : imageProgress * 22;
  const sideOpacity = isCompact ? 0 : imageProgress;
  const sideTranslateLeft = isCompact ? 0 : -100 + (imageProgress * 100);
  const sideTranslateRight = isCompact ? 0 : 100 - (imageProgress * 100);
  const borderRadius = isCompact ? 0 : imageProgress * 24;
  const gap = isCompact ? 0 : imageProgress * 16;
  const sideTranslateY = isCompact ? 0 : -(imageProgress * 15);

  return (
    <section ref={sectionRef} className="relative w-full overflow-x-clip bg-background">
      {/* Sticky container for scroll animation */}
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="flex h-full w-full min-w-0 items-center justify-center">
          {/* Bento Grid Container */}
          <div 
            className="relative flex h-full w-full min-w-0 max-w-full items-stretch justify-center overflow-hidden"
            style={{
              gap: `${gap}px`,
              padding: isCompact ? "0" : `${imageProgress * 16}px`,
              paddingBottom: isCompact ? "0" : `${60 + (imageProgress * 40)}px`,
            }}
          >
            
            {/* Left Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "left").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Main Hero Video - Center */}
            <div 
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: `${centerHeight}%`,
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              <LazyVideo
                src={GP9_VIDEOS.hero}
                poster={`${ROLAND_GP9}/gp-9_hero.jpg`}
                ariaLabel="Roland GP-9 Digital Grand Piano in a modern living space"
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
              
              {/* Overlay Text - Fades out first */}
              <div 
                className="absolute inset-0 flex items-end overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0"
                style={{ opacity: textOpacity }}
              >
                <h1 className="w-full px-4 pb-4 text-[clamp(2.25rem,11vw,8rem)] font-medium leading-[0.85] tracking-tighter text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:px-6 sm:pb-6">
                  {word.split("").map((letter, index) => (
                    <span
                      key={index}
                      className="inline-block animate-[slideUp_0.8s_ease-out_forwards] opacity-0"
                      style={{
                        animationDelay: `${index * 0.06}s`,
                        transition: 'all 1.5s',
                        transitionTimingFunction: 'cubic-bezier(0.86, 0, 0.07, 1)',
                        width: letter === " " ? "0.35em" : undefined,
                      }}
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </span>
                  ))}
                </h1>
              </div>
            </div>

            {/* Right Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "right").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Scroll space to enable animation */}
      <div className={isCompact ? "h-[80vh]" : "h-[140vh]"} />

      {/* Tagline Section */}
      <div id="about" className="scroll-mt-24 px-4 py-16 sm:px-6 md:px-10 md:py-20 lg:px-16 lg:py-24">
        <p className="mx-auto max-w-2xl text-center text-xl leading-relaxed text-muted-foreground sm:text-2xl md:text-3xl lg:leading-snug">
          Authentic grand piano touch,
          <br />
          immersive sound at home.
        </p>
      </div>
    </section>
  );
}

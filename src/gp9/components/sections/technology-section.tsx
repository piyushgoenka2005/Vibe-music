"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/gp9/components/ui/scroll-reveal";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

function ScrollRevealText({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const startOffset = windowHeight * 0.9;
      const endOffset = windowHeight * 0.1;
      const totalDistance = startOffset - endOffset;
      const currentPosition = startOffset - rect.top;
      const newProgress = Math.max(0, Math.min(1, currentPosition / totalDistance));
      setProgress(newProgress);
    };

    handleScroll();
    return subscribeScroll(handleScroll);
  }, []);

  const words = text.split(" ");

  return (
    <p
      ref={containerRef}
      className="text-3xl font-semibold leading-snug md:text-4xl lg:text-5xl"
    >
      {words.map((word, index) => {
        const wordProgress = index / words.length;
        const isRevealed = progress > wordProgress;

        return (
          <span
            key={index}
            className="transition-colors duration-150"
            style={{
              color: isRevealed ? "var(--foreground)" : "#e4e4e7",
            }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

const ROLAND_GP9 = "https://static.roland.com/products/gp-9/images";
const ROLAND_GALLERY = `${ROLAND_GP9}/gallery`;

const sideImages = [
  {
    src: `${ROLAND_GALLERY}/gp-9_angle_open_gal.jpg`,
    alt: "GP-9 Digital Piano - angle with lid open",
    position: "left",
    span: 1,
  },
  {
    src: `${ROLAND_GALLERY}/gp-9_front_gal.jpg`,
    alt: "GP-9 Digital Piano - front view",
    position: "left",
    span: 1,
  },
  {
    src: `${ROLAND_GALLERY}/gp-9_pedals_gal.jpg`,
    alt: "GP-9 Digital Piano - pedals detail",
    position: "right",
    span: 1,
  },
  {
    src: `${ROLAND_GALLERY}/gp-9_speakers_gal.jpg`,
    alt: "GP-9 Digital Piano - Piano Reality Projection speakers",
    position: "right",
    span: 1,
  },
];

export function TechnologySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const descriptionText =
    "The GP-9 reimagines the digital grand with Piano Reality technology — multi-dimensional sound projection, a hybrid keyboard with escapement, and a cabinet voiced like a concert instrument. Every note resonates through the room with depth, warmth, and clarity.";

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

  const titleOpacity = Math.max(0, 1 - scrollProgress / 0.2);
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));

  const centerWidth = 100 - imageProgress * 58;
  const sideWidth = imageProgress * 22;
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + imageProgress * 100;
  const sideTranslateRight = 100 - imageProgress * 100;
  const borderRadius = imageProgress * 24;
  const gap = imageProgress * 16;

  return (
    <section ref={sectionRef} className="relative w-full overflow-x-clip bg-primary">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

        <div className="flex h-full w-full min-w-0 items-center justify-center">
          <div
            className="relative flex h-full w-full min-w-0 max-w-full items-stretch justify-center overflow-hidden"
            style={{ gap: `${gap}px`, padding: `${imageProgress * 16}px` }}
          >
            <div
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "left")
                .map((img, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden will-change-transform"
                    style={{ flex: img.span, borderRadius: `${borderRadius}px` }}
                  >
                    <Image src={img.src || "/placeholder.svg"} alt={img.alt} fill className="object-cover" />
                  </div>
                ))}
            </div>

            <div
              className="relative overflow-hidden will-change-transform image-vignette"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Image
                src={`${ROLAND_GP9}/gp-9_more_info_7.jpg`}
                alt="Roland GP-9 Digital Grand Piano"
                fill
                className="object-cover"
                style={{ transform: `scale(${1 + imageProgress * 0.05})` }}
              />
              <div className="absolute inset-0 bg-primary/40" />

              <div
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                style={{ opacity: titleOpacity }}
              >
                <p className="mb-6 text-xs uppercase tracking-[0.4em] text-white/50">Piano Reality</p>
                <h2 className="max-w-3xl text-5xl font-medium leading-tight tracking-tight text-white md:text-5xl lg:text-7xl">
                  {["Sound", "Meets", "Space."].map((word, index) => {
                    const wordFadeStart = index * 0.07;
                    const wordFadeEnd = wordFadeStart + 0.07;
                    const wordProgress = Math.max(
                      0,
                      Math.min(1, (scrollProgress - wordFadeStart) / (wordFadeEnd - wordFadeStart))
                    );
                    const wordOpacity = 1 - wordProgress;
                    const wordBlur = wordProgress * 10;

                    return (
                      <span
                        key={index}
                        className="inline-block"
                        style={{
                          opacity: wordOpacity,
                          filter: `blur(${wordBlur}px)`,
                          marginRight: index < 2 ? "0.3em" : "0",
                        }}
                      >
                        {word}
                        {index === 1 && <br />}
                      </span>
                    );
                  })}
                </h2>
              </div>
            </div>

            <div
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "right")
                .map((img, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden will-change-transform"
                    style={{ flex: img.span, borderRadius: `${borderRadius}px` }}
                  >
                    <Image src={img.src || "/placeholder.svg"} alt={img.alt} fill className="object-cover" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[140vh]" />

      <div
        ref={textSectionRef}
        className="relative overflow-hidden bg-background px-4 py-16 sm:px-6 md:px-10 md:py-24 lg:px-16 lg:py-28"
      >
        <ScrollReveal className="relative z-10 mx-auto max-w-4xl">
          <ScrollRevealText text={descriptionText} />
        </ScrollReveal>
      </div>
    </section>
  );
}

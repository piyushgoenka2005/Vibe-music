"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type UseCinematicScrollOptions = {
  enabled: boolean;
  layoutRef: RefObject<HTMLElement | null>;
  pinRef: RefObject<HTMLElement | null>;
  copyColRef: RefObject<HTMLElement | null>;
  onActiveShot: (index: number) => void;
};

export function useCinematicScroll({
  enabled,
  layoutRef,
  pinRef,
  copyColRef,
  onActiveShot,
}: UseCinematicScrollOptions) {
  useEffect(() => {
    if (!enabled) return;

    const layout = layoutRef.current;
    const pin = pinRef.current;
    const copyCol = copyColRef.current;
    if (!layout || !pin || !copyCol) return;

    const shots = Array.from(copyCol.querySelectorAll<HTMLElement>(".gp9-cinematic-shot"));
    if (shots.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      onActiveShot(0);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: layout,
        start: "top top",
        end: "bottom bottom",
        pin: pin,
        pinSpacing: false,
        anticipatePin: 1,
      });

      shots.forEach((section, index) => {
        const copy = section.querySelector(".gp9-cinematic-copy");
        const title = section.querySelector(".gp9-cinematic-shot-title");
        const subtitle = section.querySelector(".gp9-cinematic-shot-subtitle");
        const label = section.querySelector(".gp9-cinematic-shot-label");

        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () => onActiveShot(index),
          onEnterBack: () => onActiveShot(index),
        });

        const targets = [label, subtitle, title, copy].filter(Boolean);
        gsap.fromTo(
          targets,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              end: "top 42%",
              scrub: 0.65,
            },
          }
        );
      });

      ScrollTrigger.refresh();
    }, layout);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [enabled, layoutRef, pinRef, copyColRef, onActiveShot]);
}

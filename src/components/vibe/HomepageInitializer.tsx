"use client";

import { useEffect } from "react";
import { initPersonalizationCarousel } from "@/lib/personalizationCarousel";

function removeSkeletons(root: ParentNode): void {
  root.querySelectorAll(".slider-loading-animation").forEach((node) => {
    node.remove();
  });
}

/** Static homepage HTML is served locally; remove Vue skeleton overlays only. */
export default function HomepageInitializer() {
  useEffect(() => {
    const mainRoot =
      document.querySelector("#main-content") ??
      document.querySelector("main");

    if (!mainRoot) return;

    let cleanupCarousel = () => {};

    const timeoutId = window.setTimeout(() => {
      removeSkeletons(mainRoot);
      cleanupCarousel = initPersonalizationCarousel(mainRoot);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      cleanupCarousel();
    };
  }, []);

  return null;
}

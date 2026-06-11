"use client";

import { useEffect } from "react";
import { initPersonalizationCarousel } from "@/lib/personalizationCarousel";
import { initProductSuggestSliders } from "@/lib/productSuggestSlider";
import { initSalesEngineerSection } from "@/lib/salesEngineerCarousel";
import { initTileSliders } from "@/lib/tileSlider";

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
    let cleanupTileSliders = () => {};
    let cleanupProductSuggest = () => {};
    let cleanupSalesEngineer = () => {};

    const timeoutId = window.setTimeout(() => {
      removeSkeletons(mainRoot);
      cleanupCarousel = initPersonalizationCarousel(mainRoot);
      cleanupTileSliders = initTileSliders(mainRoot);
      cleanupProductSuggest = initProductSuggestSliders(mainRoot);
      cleanupSalesEngineer = initSalesEngineerSection(mainRoot);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      cleanupCarousel();
      cleanupTileSliders();
      cleanupProductSuggest();
      cleanupSalesEngineer();
    };
  }, []);

  return null;
}

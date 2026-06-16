"use client";

import { useEffect, type ReactNode } from "react";
import { initProductSuggestSliders } from "@/lib/productSuggestSlider";
import { initTileSliders } from "@/lib/tileSlider";

interface HomepageSectionsShellProps {
  children: ReactNode;
}

export default function HomepageSectionsShell({ children }: HomepageSectionsShellProps) {
  useEffect(() => {
    const mainRoot = document.getElementById("main-content");
    if (!mainRoot) return;

    const cleanupTiles = initTileSliders(mainRoot);
    const cleanupCarousels = initProductSuggestSliders(mainRoot);

    return () => {
      cleanupTiles();
      cleanupCarousels();
    };
  }, [children]);

  return (
    <div className="homepage-wrapper" id="main-content">
      {children}
    </div>
  );
}

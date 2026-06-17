"use client";

import { Children, useEffect, type ReactNode } from "react";
import { initProductSuggestSliders } from "@/lib/productSuggestSlider";
import { initTileSliders } from "@/lib/tileSlider";

interface HomepageSectionsShellProps {
  children: ReactNode;
}

export default function HomepageSectionsShell({ children }: HomepageSectionsShellProps) {
  const items = Children.toArray(children).filter(Boolean);

  useEffect(() => {
    const mainRoot = document.querySelector<HTMLElement>(".homepage-wrapper");
    if (!mainRoot) return;

    const cleanupTiles = initTileSliders(mainRoot);
    const cleanupCarousels = initProductSuggestSliders(mainRoot);

    return () => {
      cleanupTiles();
      cleanupCarousels();
    };
  }, [children]);

  if (items.length === 0) {
    return null;
  }

  return <div className="homepage-wrapper">{children}</div>;
}

"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";
import { initProductSuggestSliders } from "@/lib/productSuggestSlider";
import { initTileSliders } from "@/lib/tileSlider";

interface HomepageSectionsShellProps {
  children: ReactNode;
}

export default function HomepageSectionsShell({ children }: HomepageSectionsShellProps) {
  const items = Children.toArray(children).filter(Boolean);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const mainRoot = document.querySelector<HTMLElement>(".homepage-wrapper");
    if (!mainRoot) return;

    initializedRef.current = true;
    const cleanupTiles = initTileSliders(mainRoot);
    const cleanupCarousels = initProductSuggestSliders(mainRoot);

    return () => {
      initializedRef.current = false;
      cleanupTiles();
      cleanupCarousels();
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return <div className="homepage-wrapper">{children}</div>;
}

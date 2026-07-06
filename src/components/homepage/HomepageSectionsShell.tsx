"use client";

import { Children, useLayoutEffect, useRef, type ReactNode } from "react";
import { initProductSuggestSliders } from "@/lib/productSuggestSlider";
import { initTileSliders } from "@/lib/tileSlider";

interface HomepageSectionsShellProps {
  children: ReactNode;
}

export default function HomepageSectionsShell({ children }: HomepageSectionsShellProps) {
  const items = Children.toArray(children).filter(Boolean);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    const cleanupTiles = initTileSliders(root);
    let cleanupCarousels = initProductSuggestSliders(root);

    const refreshCarousels = () => {
      cleanupCarousels();
      cleanupCarousels = initProductSuggestSliders(root);
    };

    const resizeObserver = new ResizeObserver(refreshCarousels);
    resizeObserver.observe(root);

    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(refreshCarousels, { timeout: 500 })
        : window.setTimeout(refreshCarousels, 120);

    return () => {
      resizeObserver.disconnect();
      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else {
        window.cancelIdleCallback(idleId);
      }
      cleanupTiles();
      cleanupCarousels();
    };
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="homepage-wrapper">
      {children}
    </div>
  );
}

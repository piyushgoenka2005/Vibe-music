"use client";

import { Children, useLayoutEffect, useRef, type ReactNode } from "react";
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
    return () => {
      cleanupTiles();
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

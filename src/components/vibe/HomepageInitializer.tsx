"use client";

import { useEffect } from "react";

function removeSkeletons(root: ParentNode): void {
  root.querySelectorAll(".slider-loading-animation").forEach((node) => {
    node.remove();
  });
}

/** Static homepage HTML is served locally; remove Vue skeleton overlays only. */
export default function HomepageInitializer() {
  useEffect(() => {
    const mainRoot = document.querySelector('[data-vibe-section="main"]');
    if (!mainRoot) return;

    const timeoutId = window.setTimeout(() => {
      removeSkeletons(mainRoot);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}

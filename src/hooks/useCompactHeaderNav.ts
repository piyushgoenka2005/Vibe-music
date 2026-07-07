"use client";

import { useLayoutEffect, useState } from "react";

const COMPACT_NAV_QUERY = "(max-width: 1023px)";

/** True when the hamburger drawer nav is active (tablet + phone). */
export function useCompactHeaderNav(): boolean {
  // Start with the server value (false) so SSR and the first client render
  // match; the layout effect applies the real viewport state before paint.
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(COMPACT_NAV_QUERY);
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return compact;
}

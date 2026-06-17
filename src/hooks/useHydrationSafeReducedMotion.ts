"use client";

import { useReducedMotion } from "framer-motion";
import { useIsClient } from "@/hooks/useIsClient";

/** Motion-safe for SSR: no animated initial styles until after hydration. */
export function useHydrationSafeReducedMotion(): boolean {
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();
  return !isClient || Boolean(prefersReducedMotion);
}

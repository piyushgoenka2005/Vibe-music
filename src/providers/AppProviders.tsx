"use client";

import QueryProvider from "@/providers/QueryProvider";

/** Outermost client providers — must wrap all routes that use React Query during SSR. */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

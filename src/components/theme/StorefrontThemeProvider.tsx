"use client";

import { useEffect } from "react";
import { GlassFilter } from "@/components/ui/liquid-glass";
import { applyStorefrontTheme } from "@/lib/storefrontTheme";
import { useStorefrontThemeStore } from "@/store/storefrontThemeStore";
import "@/styles/storefront-theme.css";
import "@/styles/apple-liquid-glass-switcher.css";

export default function StorefrontThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useStorefrontThemeStore((state) => state.theme);

  useEffect(() => {
    applyStorefrontTheme(theme);
  }, [theme]);

  return (
    <>
      <GlassFilter />
      {children}
    </>
  );
}

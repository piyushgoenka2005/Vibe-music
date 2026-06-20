export const STOREFRONT_THEMES = ["light", "dark", "dim"] as const;

export type StorefrontTheme = (typeof STOREFRONT_THEMES)[number];

export function isStorefrontTheme(value: unknown): value is StorefrontTheme {
  return (
    typeof value === "string" &&
    (STOREFRONT_THEMES as readonly string[]).includes(value)
  );
}

export function normalizeStorefrontTheme(value: unknown): StorefrontTheme {
  return isStorefrontTheme(value) ? value : "light";
}

/** Apply theme to `<html>` — safe on server (no-op). */
export function applyStorefrontTheme(theme: StorefrontTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-storefront-theme", theme);
  root.style.colorScheme = theme === "light" ? "light" : "dark";
}

export const STOREFRONT_THEME_STORAGE_KEY = "vibe-storefront-theme";

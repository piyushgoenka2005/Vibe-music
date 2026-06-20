"use client";

import { ThemePopoutSwitcher } from "@/components/ui/apple-liquid-glass-switcher";
import { useStorefrontThemeStore } from "@/store/storefrontThemeStore";

export default function HeaderThemeSwitcher() {
  const theme = useStorefrontThemeStore((state) => state.theme);
  const setTheme = useStorefrontThemeStore((state) => state.setTheme);

  return (
    <div className="site-header__theme">
      <ThemePopoutSwitcher onValueChange={setTheme} value={theme} />
    </div>
  );
}

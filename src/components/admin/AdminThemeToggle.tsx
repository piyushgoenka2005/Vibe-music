"use client";

import { Moon, Sun } from "lucide-react";
import { useAdminUiStore } from "@/store/adminUiStore";

export default function AdminThemeToggle() {
  const theme = useAdminUiStore((s) => s.theme);
  const toggleTheme = useAdminUiStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      className="admin-icon-btn"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

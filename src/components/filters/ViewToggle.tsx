"use client";

import { LayoutGrid, List } from "lucide-react";
import type { ViewMode } from "@/types/filters";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="cat-view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        className={value === "grid" ? "cat-view-toggle__btn--active" : ""}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid size={18} />
      </button>
      <button
        type="button"
        className={value === "list" ? "cat-view-toggle__btn--active" : ""}
        aria-label="List view"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        <List size={18} />
      </button>
    </div>
  );
}

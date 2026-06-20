"use client";

import React, { useEffect, useRef, useState } from "react";
import { CloudMoon, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "@/components/ui/liquid-glass";

import type { StorefrontTheme } from "@/lib/storefrontTheme";

export type Theme = StorefrontTheme;

export interface ThemeSwitcherProps {
  defaultValue?: Theme;
  value?: Theme;
  onValueChange?: (theme: Theme) => void;
  className?: string;
}

const themeOptions: Array<{
  value: Theme;
  cOption: string;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", cOption: "1", label: "Light mode", Icon: Sun },
  { value: "dark", cOption: "2", label: "Dark mode", Icon: Moon },
  { value: "dim", cOption: "3", label: "Dim mode", Icon: CloudMoon },
];

function SwitcherFilters() {
  return (
    <svg aria-hidden className="switcher__filter">
      <filter id="switcher" primitiveUnits="objectBoundingBox">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.004 0.008"
          numOctaves={1}
          seed={17}
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation={0.04} result="softMap" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale={0.5}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <filter id="toggler" primitiveUnits="objectBoundingBox">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.004 0.008"
          numOctaves={1}
          seed={23}
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation={0.01} result="softMap" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale={0.5}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export function ThemeSwitcher({
  defaultValue = "light",
  value,
  onValueChange,
  className,
}: ThemeSwitcherProps) {
  const [internalValue, setInternalValue] = useState<Theme>(defaultValue);
  const [previousOption, setPreviousOption] = useState<string | null>(null);

  const activeValue = value ?? internalValue;

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: Theme) => {
    const currentOption = themeOptions.find(
      (option) => option.value === activeValue
    )?.cOption;
    setPreviousOption(currentOption ?? null);

    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const previousCAttribute = previousOption;

  return (
    <fieldset
      className={cn("switcher", className)}
      data-previous={previousCAttribute ?? undefined}
    >
      <legend className="switcher__legend">Choose theme</legend>

      {themeOptions.map((option) => (
        <label key={option.value} className="switcher__option">
          <input
            aria-label={option.label}
            checked={activeValue === option.value}
            className="switcher__input"
            data-c-option={option.cOption}
            name="storefront-theme"
            onChange={() => handleChange(option.value)}
            type="radio"
            value={option.value}
          />
          <option.Icon aria-hidden className="switcher__icon" size={18} strokeWidth={1.75} />
        </label>
      ))}

      <SwitcherFilters />
    </fieldset>
  );
}

/** 21st.dev scaffold alias */
export const Component = ThemeSwitcher;

export interface ThemePopoutSwitcherProps {
  value: Theme;
  onValueChange: (theme: Theme) => void;
  className?: string;
}

/** Single trigger — all 3 theme options pop out on open. */
export function ThemePopoutSwitcher({
  value,
  onValueChange,
  className,
}: ThemePopoutSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeOption =
    themeOptions.find((option) => option.value === value) ?? themeOptions[0];
  const ActiveIcon = activeOption.Icon;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("theme-popout", open && "theme-popout--open", className)}
    >
      <div className="theme-popout__options" role="listbox" aria-label="Theme">
        {themeOptions.map((option, index) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={option.label}
              className={cn(
                "theme-popout__option",
                selected && "theme-popout__option--selected"
              )}
              style={{ "--pop-index": index } as React.CSSProperties}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              <GlassSurface tint="rgba(255, 255, 255, 0.78)" />
              <option.Icon
                aria-hidden
                className="theme-popout__option-icon"
                size={17}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${activeOption.label}. Open theme menu`}
        className={cn(
          "theme-popout__trigger",
          open && "theme-popout__trigger--open"
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <GlassSurface tint="rgba(255, 255, 255, 0.78)" />
        <ActiveIcon
          aria-hidden
          className="theme-popout__trigger-icon"
          size={18}
          strokeWidth={1.75}
        />
      </button>
    </div>
  );
}

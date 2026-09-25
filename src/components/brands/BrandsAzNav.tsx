"use client";

import { useMemo } from "react";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";

const LETTERS = [
  "#",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

interface BrandsAzNavProps {
  brands: BrandDirectoryGroup[];
  activeLetter: string | null;
  onLetterChange: (letter: string | null) => void;
}

export default function BrandsAzNav({ brands, activeLetter, onLetterChange }: BrandsAzNavProps) {
  const availableLetters = useMemo(() => new Set(brands.map((brand) => brand.letter)), [brands]);

  return (
    <nav className="brands-directory__az" aria-label="Jump to brand letter">
      {LETTERS.map((letter) => {
        const enabled = availableLetters.has(letter);
        const pressed = activeLetter === letter;
        return (
          <button
            key={letter}
            type="button"
            className={`brands-directory__az-btn${pressed ? " is-active" : ""}`}
            disabled={!enabled}
            aria-pressed={pressed}
            onClick={() => onLetterChange(pressed ? null : letter)}
          >
            {letter}
          </button>
        );
      })}
    </nav>
  );
}

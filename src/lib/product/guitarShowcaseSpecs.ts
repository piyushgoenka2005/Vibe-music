import type { ProductSpec } from "@/types/product";

export interface GuitarShowcaseSpec {
  label: string;
  value: string;
}

export interface GuitarShowcaseRow {
  left: GuitarShowcaseSpec;
  right: GuitarShowcaseSpec;
}

/** Fixed left/right spec pairs for the guitar showcase layout. */
export const GUITAR_SHOWCASE_ROW_LABELS: Array<{
  left: string;
  right: string;
}> = [
  { left: "Type", right: "Body" },
  { left: "Neck", right: "Fingerboard" },
  { left: "Scale Length", right: "Pickup" },
  { left: "Controls", right: "Pickup Selector" },
  { left: "Bridge", right: "Tuners & Hardware" },
];

const LABEL_ALIASES: Record<string, string[]> = {
  Type: ["type", "guitar type", "body style", "style"],
  Body: ["body", "body wood", "body material", "body wood/material"],
  Neck: ["neck", "neck material", "neck wood", "neck wood/material"],
  Fingerboard: ["fingerboard", "fretboard", "fret board"],
  "Scale Length": ["scale length", "scale"],
  Pickup: ["pickup", "pickups", "pickup configuration", "pickups configuration"],
  Controls: ["controls", "electronics"],
  "Pickup Selector": [
    "pickup selector",
    "selector",
    "selector switch",
    "pickup switch",
  ],
  Bridge: ["bridge", "bridge type"],
  "Tuners & Hardware": [
    "tuners & hardware",
    "tuners and hardware",
    "tuners",
    "hardware",
    "tuning machines",
  ],
};

export const GUITAR_SHOWCASE_PLACEHOLDER = "—";

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSpecValue(
  specs: ProductSpec[],
  canonicalLabel: string
): string | null {
  const aliases = new Set([
    normalizeLabel(canonicalLabel),
    ...(LABEL_ALIASES[canonicalLabel] ?? []).map(normalizeLabel),
  ]);

  for (const spec of specs) {
    const label = normalizeLabel(spec.label);
    if (!aliases.has(label)) continue;
    const value = spec.value.trim();
    if (value) return value;
  }

  return null;
}

export function buildGuitarShowcaseRows(
  specs: ProductSpec[]
): GuitarShowcaseRow[] {
  return GUITAR_SHOWCASE_ROW_LABELS.map(({ left, right }) => ({
    left: {
      label: left,
      value: findSpecValue(specs, left) ?? GUITAR_SHOWCASE_PLACEHOLDER,
    },
    right: {
      label: right,
      value: findSpecValue(specs, right) ?? GUITAR_SHOWCASE_PLACEHOLDER,
    },
  }));
}

export function isGuitarProduct(categorySlug: string, category: string): boolean {
  const slug = categorySlug.toLowerCase();
  const name = category.toLowerCase();
  return slug === "guitars" || slug === "guitar" || name === "guitars";
}

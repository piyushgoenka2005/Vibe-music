import { GUITAR_SHOWCASE_ROW_LABELS } from "@/lib/product/guitarShowcaseSpecs";

export const GUITAR_SPEC_FIELD_LABELS = GUITAR_SHOWCASE_ROW_LABELS.flatMap(
  (row) => [row.left, row.right]
);

export type GuitarSpecFormValues = Record<string, string>;

export function emptyGuitarSpecForm(): GuitarSpecFormValues {
  return Object.fromEntries(
    GUITAR_SPEC_FIELD_LABELS.map((label) => [label, ""])
  );
}

export function guitarSpecsFromSpecifications(
  specifications?: Record<string, string>
): GuitarSpecFormValues {
  const values = emptyGuitarSpecForm();
  if (!specifications) return values;

  for (const label of GUITAR_SPEC_FIELD_LABELS) {
    const value = specifications[label];
    if (value?.trim()) values[label] = value.trim();
  }

  return values;
}

export function guitarSpecsToSpecifications(
  guitarSpecs: GuitarSpecFormValues
): Record<string, string> {
  const specifications: Record<string, string> = {};
  for (const [label, value] of Object.entries(guitarSpecs)) {
    const trimmed = value.trim();
    if (trimmed) specifications[label] = trimmed;
  }
  return specifications;
}

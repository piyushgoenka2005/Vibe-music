"use client";

import {
  GUITAR_SHOWCASE_FIELD_LABELS,
  GUITAR_SHOWCASE_ROW_LABELS,
} from "@/lib/product/guitarShowcaseSpecs";

interface GuitarSpecsEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export default function GuitarSpecsEditor({ specs, onChange }: GuitarSpecsEditorProps) {
  function updateField(label: string, value: string) {
    onChange({ ...specs, [label]: value });
  }

  return (
    <div className="admin-form-grid--full">
      <div className="admin-form-group">
        <label>Showcase specifications</label>
        <p className="admin-form-hint">
          These fields power the guitar specs section on the product page. Leave
          blank to auto-fill from the product name when saved.
        </p>
      </div>
      <div className="admin-form-grid">
        {GUITAR_SHOWCASE_ROW_LABELS.flatMap(({ left, right }) => [left, right]).map(
          (label) => (
            <div key={label} className="admin-form-group">
              <label>{label}</label>
              <input
                className="admin-input"
                style={{ width: "100%" }}
                value={specs[label] ?? ""}
                onChange={(e) => updateField(label, e.target.value)}
                placeholder={`Auto: ${label}`}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function extractGuitarSpecsFromRecord(
  specifications: Record<string, string> | undefined
): Record<string, string> {
  if (!specifications) return {};
  const result: Record<string, string> = {};
  for (const label of GUITAR_SHOWCASE_FIELD_LABELS) {
    const value = specifications[label]?.trim();
    if (value) result[label] = value;
  }
  return result;
}

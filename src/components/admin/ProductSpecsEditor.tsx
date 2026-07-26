"use client";

import type { ProductSpec } from "@/types/product";

interface ProductSpecsEditorProps {
  specs: ProductSpec[];
  onChange: (specs: ProductSpec[]) => void;
}

export default function ProductSpecsEditor({
  specs,
  onChange,
}: ProductSpecsEditorProps) {
  const rows = specs.length > 0 ? specs : [{ label: "", value: "" }];

  function updateRow(index: number, patch: Partial<ProductSpec>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    const last = next[next.length - 1];
    if (last && (last.label.trim() || last.value.trim())) {
      next.push({ label: "", value: "" });
    }
    while (
      next.length > 2 &&
      !next[next.length - 1]?.label.trim() &&
      !next[next.length - 1]?.value.trim() &&
      !next[next.length - 2]?.label.trim() &&
      !next[next.length - 2]?.value.trim()
    ) {
      next.pop();
    }
    onChange(next);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([{ label: "", value: "" }]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>Specifications</label>
      <p className="admin-form-hint">
        Spec rows shown on the product page Specs tab. Guitar products also use the
        guitar specs editor below when applicable.
      </p>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {rows.map((row, index) => (
          <div
            key={`spec-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              className="admin-input"
              value={row.label}
              placeholder="Label (e.g. Weight)"
              onChange={(e) => updateRow(index, { label: e.target.value })}
            />
            <input
              type="text"
              className="admin-input"
              value={row.value}
              placeholder="Value"
              onChange={(e) => updateRow(index, { value: e.target.value })}
            />
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              aria-label={`Remove spec ${index + 1}`}
              onClick={() => removeRow(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

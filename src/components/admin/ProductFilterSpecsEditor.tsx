"use client";

import { Plus, Trash2 } from "lucide-react";
import { GUITAR_SHOWCASE_FIELD_LABELS } from "@/lib/product/guitarShowcaseSpecs";

const RESERVED_KEYS = new Set(["Manufacturer", "Category", "SKU", ...GUITAR_SHOWCASE_FIELD_LABELS]);

interface SpecRow {
  key: string;
  value: string;
}

interface ProductFilterSpecsEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export function extractFilterSpecsFromRecord(
  specifications: Record<string, string> | undefined,
): Record<string, string> {
  if (!specifications) return {};
  return Object.fromEntries(
    Object.entries(specifications).filter(
      ([key, value]) => value.trim() && !RESERVED_KEYS.has(key),
    ),
  );
}

function toRows(specs: Record<string, string>): SpecRow[] {
  const entries = Object.entries(specs);
  if (entries.length === 0) return [{ key: "", value: "" }];
  return entries.map(([key, value]) => ({ key, value }));
}

function fromRows(rows: SpecRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (key && value) result[key] = value;
  }
  return result;
}

export default function ProductFilterSpecsEditor({
  specs,
  onChange,
}: ProductFilterSpecsEditorProps) {
  const rows = toRows(specs);

  function updateRows(nextRows: SpecRow[]) {
    onChange(fromRows(nextRows));
  }

  return (
    <div className="admin-form-grid--full">
      <div className="admin-form-group">
        <label>Filter specifications</label>
        <p className="admin-form-hint">
          Key/value pairs used for category filters and the PDP specs tab (non-guitar products).
        </p>
      </div>
      {rows.map((row, index) => (
        <div
          key={index}
          className="admin-form-grid"
          style={{ gridColumn: "1 / -1", alignItems: "end" }}
        >
          <div className="admin-form-group">
            <label>Label</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={row.key}
              placeholder="e.g. Connectivity"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], key: e.target.value };
                updateRows(next);
              }}
            />
          </div>
          <div className="admin-form-group">
            <label>Value</label>
            <input
              className="admin-input"
              style={{ width: "100%" }}
              value={row.value}
              placeholder="e.g. USB-C"
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...next[index], value: e.target.value };
                updateRows(next);
              }}
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            aria-label="Remove specification row"
            onClick={() => updateRows(rows.filter((_, i) => i !== index))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--secondary"
        onClick={() => updateRows([...rows, { key: "", value: "" }])}
      >
        <Plus size={16} style={{ marginRight: "0.35rem" }} />
        Add specification
      </button>
    </div>
  );
}

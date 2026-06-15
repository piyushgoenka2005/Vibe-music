"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import { DEFAULT_BUNDLE_DISCOUNT_PERCENT } from "@/types/bundle";
import type { AdminProduct } from "@/types/admin";

export interface ProductBundleFormState {
  relatedProductIds: string[];
  discountPercent: number;
  isActive: boolean;
}

interface ProductBundleEditorProps {
  productId?: string;
  currentProductName: string;
  currentProductSlug: string;
  bundle: ProductBundleFormState;
  onChange: (bundle: ProductBundleFormState) => void;
}

const EMPTY_BUNDLE: ProductBundleFormState = {
  relatedProductIds: [],
  discountPercent: DEFAULT_BUNDLE_DISCOUNT_PERCENT,
  isActive: true,
};

export function createEmptyBundleState(): ProductBundleFormState {
  return { ...EMPTY_BUNDLE, relatedProductIds: [] };
}

export default function ProductBundleEditor({
  productId,
  currentProductName,
  currentProductSlug,
  bundle,
  onChange,
}: ProductBundleEditorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedProducts = useMemo(
    () => bundle.relatedProductIds,
    [bundle.relatedProductIds]
  );

  async function runSearch(query: string) {
    setSearch(query);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(query)}&limit=12`
      );
      const data = (await res.json()) as { products?: AdminProduct[] };
      setResults(
        (data.products ?? []).filter((product) => product.id !== productId)
      );
    } finally {
      setSearching(false);
    }
  }

  function addProduct(id: string) {
    if (selectedProducts.includes(id) || selectedProducts.length >= 6) return;
    onChange({
      ...bundle,
      relatedProductIds: [...selectedProducts, id],
    });
    setSearch("");
    setResults([]);
  }

  function removeProduct(id: string) {
    onChange({
      ...bundle,
      relatedProductIds: selectedProducts.filter((entry) => entry !== id),
    });
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedProducts.length) return;
    const ordered = [...selectedProducts];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved!);
    onChange({ ...bundle, relatedProductIds: ordered });
  }

  return (
    <div className="admin-panel" style={{ marginTop: "1rem" }}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Frequently Bought Together</h2>
      </div>
      <div className="admin-panel__body">
        <p style={{ color: "var(--admin-muted)", marginTop: 0 }}>
          Configure bundle products for <strong>{currentProductName || "this product"}</strong>.
          Shoppers see a combined bundle with discount on the product page.
        </p>

        <div className="admin-form-grid">
          <div className="admin-form-group">
            <label>Bundle discount (%)</label>
            <input
              className="admin-input"
              type="number"
              min={0}
              max={50}
              style={{ width: "100%" }}
              value={bundle.discountPercent}
              onChange={(event) =>
                onChange({
                  ...bundle,
                  discountPercent: Number(event.target.value),
                })
              }
            />
          </div>
          <div className="admin-form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={bundle.isActive}
                onChange={(event) =>
                  onChange({ ...bundle, isActive: event.target.checked })
                }
              />
              Bundle active on storefront
            </label>
          </div>
        </div>

        <div className="admin-form-group" style={{ marginTop: "1rem" }}>
          <label>Add related product</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="admin-input"
              style={{ flex: 1 }}
              value={search}
              placeholder="Search products by name, brand, or SKU…"
              onChange={(event) => void runSearch(event.target.value)}
            />
            <span className="admin-btn admin-btn--ghost" aria-hidden="true">
              <Search size={16} />
            </span>
          </div>
          {searching ? (
            <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>Searching…</p>
          ) : null}
          {results.length > 0 ? (
            <div
              style={{
                border: "1px solid var(--admin-border)",
                borderRadius: 8,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    borderRadius: 0,
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                  onClick={() => addProduct(product.id)}
                  disabled={selectedProducts.includes(product.id)}
                >
                  <span>
                    {product.brand} — {product.name}
                  </span>
                  <Plus size={14} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedProducts.length === 0 ? (
          <p style={{ color: "var(--admin-muted)" }}>
            No related products selected. Legacy catalog suggestions may be auto-imported on first view.
          </p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((id, index) => (
                  <tr key={id}>
                    <td>
                      <code>{id}</code>
                      {currentProductSlug ? (
                        <span style={{ display: "block", fontSize: 12, color: "var(--admin-muted)" }}>
                          Paired with /product/{currentProductSlug}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          disabled={index === 0}
                          onClick={() => moveProduct(index, -1)}
                          aria-label="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          disabled={index === selectedProducts.length - 1}
                          onClick={() => moveProduct(index, 1)}
                          aria-label="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => removeProduct(id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

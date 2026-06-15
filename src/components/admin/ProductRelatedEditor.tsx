"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import { MAX_RELATED_PRODUCTS } from "@/types/relatedProducts";
import type { AdminProduct } from "@/types/admin";

export interface ProductRelatedFormState {
  relatedProductIds: string[];
  isActive: boolean;
}

interface ProductRelatedEditorProps {
  productId?: string;
  currentProductName: string;
  related: ProductRelatedFormState;
  onChange: (related: ProductRelatedFormState) => void;
}

const EMPTY_RELATED: ProductRelatedFormState = {
  relatedProductIds: [],
  isActive: true,
};

export function createEmptyRelatedState(): ProductRelatedFormState {
  return { ...EMPTY_RELATED, relatedProductIds: [] };
}

export default function ProductRelatedEditor({
  productId,
  currentProductName,
  related,
  onChange,
}: ProductRelatedEditorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedProducts = useMemo(
    () => related.relatedProductIds,
    [related.relatedProductIds]
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
    if (
      selectedProducts.includes(id) ||
      selectedProducts.length >= MAX_RELATED_PRODUCTS
    ) {
      return;
    }
    onChange({
      ...related,
      relatedProductIds: [...selectedProducts, id],
    });
    setSearch("");
    setResults([]);
  }

  function removeProduct(id: string) {
    onChange({
      ...related,
      relatedProductIds: selectedProducts.filter((entry) => entry !== id),
    });
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedProducts.length) return;
    const ordered = [...selectedProducts];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved!);
    onChange({ ...related, relatedProductIds: ordered });
  }

  return (
    <div className="admin-panel" style={{ marginTop: "1rem" }}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Related Products</h2>
      </div>
      <div className="admin-panel__body">
        <p style={{ color: "var(--admin-muted)", marginTop: 0 }}>
          Choose up to {MAX_RELATED_PRODUCTS} related products for{" "}
          <strong>{currentProductName || "this product"}</strong>. Empty slots
          are filled automatically from the same category, then the same brand.
        </p>

        <div className="admin-form-group">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={related.isActive}
              onChange={(event) =>
                onChange({ ...related, isActive: event.target.checked })
              }
            />
            Manual picks active (disable to use category/brand fallback only)
          </label>
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
            <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>
              Searching…
            </p>
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
                  disabled={
                    selectedProducts.includes(product.id) ||
                    selectedProducts.length >= MAX_RELATED_PRODUCTS
                  }
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
            No manual related products selected. Legacy catalog picks may be
            auto-imported on first view; otherwise category and brand fallback
            applies.
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
                    <td>{id}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveProduct(index, -1)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--icon"
                          aria-label="Move down"
                          disabled={index === selectedProducts.length - 1}
                          onClick={() => moveProduct(index, 1)}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--icon"
                        aria-label="Remove"
                        onClick={() => removeProduct(id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 0 }}>
          {selectedProducts.length}/{MAX_RELATED_PRODUCTS} manual picks
        </p>
      </div>
    </div>
  );
}

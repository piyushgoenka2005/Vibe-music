"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [resolvedMap, setResolvedMap] = useState<Record<string, AdminProduct>>({});

  const selectedProducts = useMemo(() => bundle.relatedProductIds, [bundle.relatedProductIds]);

  useEffect(() => {
    let active = true;
    const missing = selectedProducts.filter((id) => !resolvedMap[id]);
    if (missing.length === 0) return;

    void Promise.all(
      missing.map(async (id) => {
        try {
          const res = await fetch(`/api/admin/products/${id}`);
          if (!res.ok) return null;
          const data = (await res.json().catch(() => ({}))) as { product?: AdminProduct };
          return data.product ?? null;
        } catch {
          return null;
        }
      }),
    ).then((products) => {
      if (!active) return;
      setResolvedMap((prev) => {
        const next = { ...prev };
        for (const p of products) {
          if (p) next[p.id] = p;
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [resolvedMap, selectedProducts]);

  async function runSearch(query: string) {
    setSearch(query);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=12`);
      const data = (await res.json().catch(() => ({}))) as { products?: AdminProduct[] };
      const fetched = (data.products ?? []).filter((product) => product.id !== productId);
      setResults(fetched);
      setResolvedMap((prev) => {
        const next = { ...prev };
        for (const p of fetched) {
          next[p.id] = p;
        }
        return next;
      });
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product: AdminProduct) {
    if (selectedProducts.includes(product.id) || selectedProducts.length >= 6) return;
    setResolvedMap((prev) => ({ ...prev, [product.id]: product }));
    onChange({
      ...bundle,
      relatedProductIds: [...selectedProducts, product.id],
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
                onChange={(event) => onChange({ ...bundle, isActive: event.target.checked })}
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
                  onClick={() => addProduct(product)}
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
            No related products selected. Legacy catalog suggestions may be auto-imported on first
            view.
          </p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((id, index) => {
                  const item = resolvedMap[id];
                  const thumbUrl = item?.images?.[0] || item?.image || "/placeholder.png";
                  const title = item ? `${item.brand ? `${item.brand} — ` : ""}${item.name}` : id;
                  const sku = item?.sku || item?.variants?.[0]?.sku || "—";
                  const price = item ? (item.salePrice ?? item.price ?? 0) : null;

                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbUrl}
                            alt={title}
                            style={{
                              width: 44,
                              height: 44,
                              objectFit: "cover",
                              borderRadius: 4,
                              background: "var(--admin-surface-2)",
                              border: "1px solid var(--admin-border)",
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{title}</div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--admin-muted)",
                                fontFamily: "monospace",
                              }}
                            >
                              {id}
                            </div>
                            {currentProductSlug ? (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: 11,
                                  color: "var(--admin-muted)",
                                }}
                              >
                                Paired with /product/{currentProductSlug}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="admin-badge admin-badge--neutral"
                          style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                        >
                          {sku}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {price != null ? `₹${price.toLocaleString("en-IN")}` : "—"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

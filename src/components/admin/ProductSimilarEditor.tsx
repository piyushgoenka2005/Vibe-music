"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/types/admin";

const MAX_SIMILAR_PRODUCTS = 4;

interface ProductSimilarEditorProps {
  productId?: string;
  currentProductName: string;
  similarProductIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ProductSimilarEditor({
  productId,
  currentProductName,
  similarProductIds,
  onChange,
}: ProductSimilarEditorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvedMap, setResolvedMap] = useState<Record<string, AdminProduct>>({});

  const selectedIds = useMemo(() => similarProductIds, [similarProductIds]);

  useEffect(() => {
    let active = true;
    const missing = selectedIds.filter((id) => !resolvedMap[id]);
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
        for (const product of products) {
          if (product) next[product.id] = product;
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [resolvedMap, selectedIds]);

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
        for (const product of fetched) {
          next[product.id] = product;
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
    if (selectedIds.includes(product.id) || selectedIds.length >= MAX_SIMILAR_PRODUCTS) return;
    setResolvedMap((prev) => ({
      ...prev,
      [product.id]: product,
    }));
    onChange([...selectedIds, product.id]);
    setSearch("");
    setResults([]);
  }

  function removeProduct(id: string) {
    onChange(selectedIds.filter((item) => item !== id));
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  return (
    <div className="admin-form-group admin-form-grid--full">
      <label>Similar products</label>
      <p className="admin-form-hint">
        Manual picks for the PDP “Similar gear” row on {currentProductName || "this product"}. Leave
        empty to auto-suggest from the same category.
      </p>

      <div style={{ position: "relative", marginBottom: "0.75rem" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <input
          className="admin-input"
          style={{ width: "100%", paddingLeft: "2.25rem" }}
          value={search}
          placeholder="Search catalog to add similar products…"
          onChange={(e) => void runSearch(e.target.value)}
        />
        {searching ? (
          <p className="admin-form-hint" style={{ marginTop: "0.35rem" }}>
            Searching…
          </p>
        ) : null}
        {results.length > 0 ? (
          <ul
            className="admin-panel"
            style={{
              marginTop: "0.35rem",
              maxHeight: "12rem",
              overflow: "auto",
              padding: "0.35rem",
            }}
          >
            {results.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => addProduct(product)}
                  disabled={selectedIds.includes(product.id)}
                >
                  <Plus size={14} style={{ marginRight: "0.35rem" }} />
                  {product.brand} — {product.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {selectedIds.length === 0 ? (
        <p className="admin-form-hint">No manual similar products selected.</p>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: "0.75rem" }}>
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
              {selectedIds.map((id, index) => {
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
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="admin-badge admin-badge--neutral"
                        style={{ fontFamily: "monospace" }}
                      >
                        {sku}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {price !== null ? `₹${price.toLocaleString("en-IN")}` : "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveProduct(index, -1)}
                          style={{ padding: "0.25rem" }}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          aria-label="Move down"
                          disabled={index === selectedIds.length - 1}
                          onClick={() => moveProduct(index, 1)}
                          style={{ padding: "0.25rem" }}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        aria-label="Remove"
                        onClick={() => removeProduct(id)}
                        style={{ padding: "0.35rem 0.6rem" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-form-hint" style={{ marginTop: "0.5rem" }}>
        {selectedIds.length}/{MAX_SIMILAR_PRODUCTS} similar picks
      </p>
    </div>
  );
}

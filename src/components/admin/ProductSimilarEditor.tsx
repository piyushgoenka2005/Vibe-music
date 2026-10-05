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
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});

  const selectedIds = useMemo(() => similarProductIds, [similarProductIds]);

  useEffect(() => {
    let active = true;
    const missing = selectedIds.filter((id) => !labelMap[id] && !results.some((p) => p.id === id));
    if (missing.length === 0) return;

    void Promise.all(
      missing.map(async (id) => {
        const res = await fetch(`/api/admin/products/${id}`);
        if (!res.ok) return null;
        const data = (await res.json()) as { product?: AdminProduct };
        return data.product ?? null;
      }),
    ).then((products) => {
      if (!active) return;
      const next = { ...labelMap };
      for (const product of products) {
        if (product) next[product.id] = `${product.brand} — ${product.name}`;
      }
      setLabelMap(next);
    });

    return () => {
      active = false;
    };
  }, [labelMap, results, selectedIds]);

  async function runSearch(query: string) {
    setSearch(query);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=12`);
      const data = (await res.json()) as { products?: AdminProduct[] };
      setResults((data.products ?? []).filter((product) => product.id !== productId));
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product: AdminProduct) {
    if (selectedIds.includes(product.id) || selectedIds.length >= MAX_SIMILAR_PRODUCTS) return;
    setLabelMap((prev) => ({
      ...prev,
      [product.id]: `${product.brand} — ${product.name}`,
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
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {selectedIds.map((id, index) => {
            return (
              <li
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0",
                  borderBottom: "1px solid var(--admin-border)",
                }}
              >
                <span style={{ flex: 1, fontSize: "0.875rem" }}>{labelMap[id] ?? id}</span>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveProduct(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  aria-label="Move down"
                  disabled={index === selectedIds.length - 1}
                  onClick={() => moveProduct(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  aria-label="Remove"
                  onClick={() => removeProduct(id)}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="admin-form-hint">
        {selectedIds.length}/{MAX_SIMILAR_PRODUCTS} similar picks
      </p>
    </div>
  );
}

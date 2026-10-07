"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, Search, Trash2 } from "lucide-react";
import { MAX_COUPON_PRODUCT_URLS } from "@/lib/coupons/parseProductUrl";
import { adminMutateJson } from "@/components/admin/AdminQueryState";
import type { AdminProduct } from "@/types/admin";

interface CouponProductPickerProps {
  productIds: string[];
  onChange: (productIds: string[]) => void;
  disabled?: boolean;
}

export default function CouponProductPicker({
  productIds,
  onChange,
  disabled = false,
}: CouponProductPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [urlPaste, setUrlPaste] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);

  const slotsLeft = MAX_COUPON_PRODUCT_URLS - productIds.length;

  useEffect(() => {
    if (productIds.length === 0) return;

    void (async () => {
      const labels: Record<string, string> = {};
      await Promise.all(
        productIds.map(async (id) => {
          try {
            const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`);
            if (!res.ok) return;
            const data = (await res.json()) as { product?: AdminProduct };
            if (data.product?.name) labels[id] = data.product.name;
          } catch {
            /* ignore */
          }
        }),
      );
      if (Object.keys(labels).length > 0) {
        setSelectedLabels((current) => ({ ...current, ...labels }));
      }
    })();
  }, [productIds]);

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
      setResults((data.products ?? []).filter((product) => !productIds.includes(product.id)));
    } finally {
      setSearching(false);
    }
  }

  function addProduct(product: AdminProduct) {
    if (productIds.includes(product.id)) return;
    if (productIds.length >= MAX_COUPON_PRODUCT_URLS) return;
    setSelectedLabels((current) => ({ ...current, [product.id]: product.name }));
    onChange([...productIds, product.id]);
    setSearch("");
    setResults([]);
  }

  function removeProduct(id: string) {
    onChange(productIds.filter((entry) => entry !== id));
    setSelectedLabels((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function resolveUrls() {
    const lines = urlPaste
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setResolving(true);
    setResolveMessage(null);
    try {
      const data = await adminMutateJson<{
        products: Array<{ id: string; name: string; slug: string }>;
        notFound: string[];
        invalid: string[];
        productIds: string[];
      }>("/api/admin/coupons/resolve-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: lines.slice(0, Math.max(0, Math.min(slotsLeft, MAX_COUPON_PRODUCT_URLS))),
        }),
      });

      const nextIds = [...productIds];
      const nextLabels = { ...selectedLabels };
      for (const product of data.products) {
        if (nextIds.length >= MAX_COUPON_PRODUCT_URLS) break;
        if (nextIds.includes(product.id)) continue;
        nextIds.push(product.id);
        nextLabels[product.id] = product.name;
      }

      onChange(nextIds);
      setSelectedLabels(nextLabels);
      setUrlPaste("");

      const parts: string[] = [];
      if (data.products.length > 0) {
        parts.push(`Added ${data.products.length} product${data.products.length === 1 ? "" : "s"}`);
      }
      if (data.notFound.length > 0) {
        parts.push(`Not found: ${data.notFound.join(", ")}`);
      }
      if (data.invalid.length > 0) {
        parts.push(`${data.invalid.length} invalid URL${data.invalid.length === 1 ? "" : "s"}`);
      }
      setResolveMessage(parts.join(" · ") || "No products resolved");
    } catch (error) {
      setResolveMessage((error as Error).message || "Could not resolve URLs");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
      <label>Dedicated products (max {MAX_COUPON_PRODUCT_URLS})</label>
      <p style={{ color: "var(--admin-muted)", margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
        Paste product URLs from your ad campaign — coupon applies only on these products. Discount
        is calculated on eligible cart lines only.
      </p>

      {productIds.length > 0 ? (
        <ul style={{ listStyle: "none", margin: "0 0 0.75rem", padding: 0 }}>
          {productIds.map((id) => (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--admin-border)",
              }}
            >
              <span>
                <strong>{selectedLabels[id] ?? id}</strong>
                <span style={{ color: "var(--admin-muted)", marginLeft: 8, fontSize: "0.8rem" }}>
                  {id}
                </span>
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={disabled}
                onClick={() => removeProduct(id)}
                aria-label={`Remove ${selectedLabels[id] ?? id}`}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--admin-muted)", margin: "0 0 0.75rem" }}>
          No products selected yet — paste URLs below or search by name.
        </p>
      )}

      <p style={{ fontSize: "0.8rem", color: "var(--admin-muted)", margin: "0 0 0.5rem" }}>
        {productIds.length} / {MAX_COUPON_PRODUCT_URLS} products selected
      </p>

      <div
        style={{
          border: "1px solid var(--admin-border)",
          borderRadius: 8,
          padding: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Link2 size={16} aria-hidden />
          <strong style={{ fontSize: "0.9rem" }}>Paste product URLs</strong>
        </div>
        <textarea
          className="admin-input"
          style={{ width: "100%", minHeight: 88, resize: "vertical" }}
          disabled={disabled || slotsLeft <= 0}
          placeholder={`One per line or comma-separated (max ${MAX_COUPON_PRODUCT_URLS})\nhttps://vibemusic.in/product/yamaha-p125\nhttps://vibemusic.in/product/roland-fp30x`}
          value={urlPaste}
          onChange={(e) => setUrlPaste(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            disabled={disabled || resolving || !urlPaste.trim() || slotsLeft <= 0}
            onClick={() => void resolveUrls()}
          >
            {resolving ? "Resolving…" : "Add from URLs"}
          </button>
          {slotsLeft <= 0 ? (
            <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>
              Maximum {MAX_COUPON_PRODUCT_URLS} products reached
            </span>
          ) : null}
        </div>
        {resolveMessage ? (
          <p style={{ fontSize: "0.8rem", margin: "8px 0 0", color: "var(--admin-muted)" }}>
            {resolveMessage}
          </p>
        ) : null}
      </div>

      <div style={{ position: "relative" }}>
        <Search
          size={16}
          aria-hidden
          style={{ position: "absolute", left: 12, top: 12, color: "var(--admin-muted)" }}
        />
        <input
          className="admin-input"
          style={{ width: "100%", paddingLeft: 36 }}
          value={search}
          disabled={disabled || slotsLeft <= 0}
          placeholder="Or search products by name, brand, or SKU…"
          onChange={(e) => void runSearch(e.target.value)}
        />
      </div>
      {searching ? (
        <p style={{ color: "var(--admin-muted)", fontSize: "0.85rem" }}>Searching…</p>
      ) : null}
      {results.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            margin: "0.5rem 0 0",
            padding: 0,
            border: "1px solid var(--admin-border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  borderRadius: 0,
                  padding: "0.65rem 0.85rem",
                }}
                disabled={disabled || slotsLeft <= 0}
                onClick={() => addProduct(product)}
              >
                <span>{product.name}</span>
                <Plus size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

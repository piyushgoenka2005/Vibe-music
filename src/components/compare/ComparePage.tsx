"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/currency";
import { ROUTES } from "@/lib/routes";
import { useCompareStore } from "@/store/compareStore";

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <main className="storefront-page"><p className="storefront-loading">Loading…</p></main>;
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Compare</p>
        <h1 className="storefront-page__title">Compare Products</h1>
        <p className="storefront-page__meta">
          Side-by-side comparison of up to 4 products.
        </p>
      </header>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p>No products to compare yet.</p>
          <p style={{ marginTop: "1rem" }}>
            <Link href={ROUTES.search}>Browse products</Link>
          </p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "40rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>Feature</th>
                  {items.map((item) => (
                    <th key={item.productId} style={{ padding: "0.75rem", minWidth: "10rem" }}>
                      <Link href={`/product/${item.slug}`}>{item.name}</Link>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem" }}
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Brand" values={items.map((i) => i.brand)} />
                <CompareRow label="Price" values={items.map((i) => formatCurrency(i.price))} />
                <CompareRow
                  label="Rating"
                  values={items.map((i) =>
                    i.reviewCount > 0 ? `${i.rating.toFixed(1)} (${i.reviewCount})` : "—"
                  )}
                />
                <CompareRow
                  label="Availability"
                  values={items.map((i) =>
                    i.availability === "in-stock"
                      ? "In stock"
                      : i.availability === "limited"
                        ? "Limited"
                        : "Out of stock"
                  )}
                />
              </tbody>
            </table>
          </div>
          <button type="button" onClick={clear}>
            Clear all
          </button>
        </>
      )}
    </main>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td style={{ padding: "0.75rem", fontWeight: 600, borderTop: "1px solid #eee" }}>{label}</td>
      {values.map((value, index) => (
        <td key={index} style={{ padding: "0.75rem", borderTop: "1px solid #eee" }}>
          {value}
        </td>
      ))}
    </tr>
  );
}

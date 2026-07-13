"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDisplayPrice } from "@/utils/currency";
import { ROUTES } from "@/lib/routes";
import { fetchProductDetail } from "@/services/product.service";
import { useCompareStore } from "@/store/compareStore";
import type { ProductSpec } from "@/types/product";
import "@/styles/compare.css";

function availabilityLabel(availability: string): string {
  if (availability === "in-stock") return "In stock";
  if (availability === "limited") return "Limited";
  return "Out of stock";
}

function conditionLabel(condition: string | undefined): string {
  if (condition === "used") return "Pre-owned";
  if (condition === "open-box") return "Open box";
  if (condition === "new") return "New";
  return "—";
}

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const [specsBySlug, setSpecsBySlug] = useState<Record<string, ProductSpec[]>>(
    {}
  );
  const [conditionsBySlug, setConditionsBySlug] = useState<
    Record<string, string>
  >({});
  const [specsLoading, setSpecsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (items.length === 0) {
      setSpecsBySlug({});
      setConditionsBySlug({});
      return;
    }

    setSpecsLoading(true);
    void Promise.all(
      items.map(async (item) => {
        const detail = await fetchProductDetail(item.slug);
        return {
          slug: item.slug,
          specs: detail?.product.specs ?? [],
          condition: detail?.product.condition ?? "new",
        };
      })
    )
      .then((rows) => {
        if (cancelled) return;
        const nextSpecs: Record<string, ProductSpec[]> = {};
        const nextConditions: Record<string, string> = {};
        for (const row of rows) {
          nextSpecs[row.slug] = row.specs;
          nextConditions[row.slug] = row.condition;
        }
        setSpecsBySlug(nextSpecs);
        setConditionsBySlug(nextConditions);
      })
      .finally(() => {
        if (!cancelled) setSpecsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const specLabels = useMemo(() => {
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      for (const spec of specsBySlug[item.slug] ?? []) {
        const label = spec.label.trim();
        if (!label || seen.has(label)) continue;
        seen.add(label);
        labels.push(label);
      }
    }
    return labels;
  }, [items, specsBySlug]);

  function specValue(slug: string, label: string): string {
    const match = (specsBySlug[slug] ?? []).find(
      (spec) => spec.label.trim() === label
    );
    return match?.value?.trim() || "—";
  }

  return (
    <main className="storefront-page storefront-page--subtle compare-page">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Compare</p>
        <h1 className="storefront-page__title">Compare Products</h1>
        <p className="storefront-page__meta">
          Side-by-side comparison of up to 4 products, including catalog specs.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="compare-page__empty">
          <p>No products to compare yet.</p>
          <p style={{ marginTop: "1rem" }}>
            <Link href={ROUTES.search}>Browse products</Link>
          </p>
        </div>
      ) : (
        <>
          <div
            className="compare-table-wrap"
            role="region"
            aria-label="Product comparison table"
            aria-describedby="compare-table-scroll-hint"
            tabIndex={0}
          >
            <p id="compare-table-scroll-hint" className="compare-table__hint">
              Scroll horizontally to compare product details.
              {specsLoading ? " Loading specs…" : null}
            </p>
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {items.map((item) => (
                    <th key={item.productId} scope="col">
                      <Link href={`/product/${item.slug}`}>{item.name}</Link>
                      <button
                        type="button"
                        className="compare-table__remove"
                        aria-label={`Remove ${item.name} from compare`}
                        onClick={() => remove(item.productId)}
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Brand" values={items.map((i) => i.brand)} />
                <CompareRow
                  label="Price"
                  values={items.map((i) => formatDisplayPrice(i.price))}
                />
                <CompareRow
                  label="Condition"
                  values={items.map((i) =>
                    conditionLabel(conditionsBySlug[i.slug])
                  )}
                />
                <CompareRow
                  label="Rating"
                  values={items.map((i) =>
                    i.reviewCount > 0
                      ? `${i.rating.toFixed(1)} (${i.reviewCount})`
                      : "—"
                  )}
                />
                <CompareRow
                  label="Availability"
                  values={items.map((i) => availabilityLabel(i.availability))}
                />
                {specLabels.map((label) => (
                  <CompareRow
                    key={label}
                    label={label}
                    values={items.map((i) => specValue(i.slug, label))}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="compare-mobile-cards" aria-label="Product comparison cards">
            {items.map((item) => (
              <article key={item.productId} className="compare-mobile-card">
                <h2 className="compare-mobile-card__title">
                  <Link href={`/product/${item.slug}`}>{item.name}</Link>
                </h2>
                <button
                  type="button"
                  className="compare-mobile-card__remove"
                  aria-label={`Remove ${item.name} from compare`}
                  onClick={() => remove(item.productId)}
                >
                  Remove from compare
                </button>
                <dl className="compare-mobile-card__rows">
                  <div className="compare-mobile-card__row">
                    <dt>Brand</dt>
                    <dd>{item.brand}</dd>
                  </div>
                  <div className="compare-mobile-card__row">
                    <dt>Price</dt>
                    <dd>{formatDisplayPrice(item.price)}</dd>
                  </div>
                  <div className="compare-mobile-card__row">
                    <dt>Condition</dt>
                    <dd>{conditionLabel(conditionsBySlug[item.slug])}</dd>
                  </div>
                  <div className="compare-mobile-card__row">
                    <dt>Rating</dt>
                    <dd>
                      {item.reviewCount > 0
                        ? `${item.rating.toFixed(1)} (${item.reviewCount})`
                        : "—"}
                    </dd>
                  </div>
                  <div className="compare-mobile-card__row">
                    <dt>Availability</dt>
                    <dd>{availabilityLabel(item.availability)}</dd>
                  </div>
                  {specLabels.map((label) => (
                    <div key={label} className="compare-mobile-card__row">
                      <dt>{label}</dt>
                      <dd>{specValue(item.slug, label)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <div className="compare-page__actions">
            <button type="button" className="compare-page__clear" onClick={clear}>
              Clear all
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th scope="row" className="compare-table__feature">
        {label}
      </th>
      {values.map((value, index) => (
        <td key={index}>{value}</td>
      ))}
    </tr>
  );
}

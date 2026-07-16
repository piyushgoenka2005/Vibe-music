"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { ROUTES } from "@/lib/routes";
import { fetchProductDetail } from "@/services/product.service";
import {
  availabilityLabel,
  collectSpecLabels,
  conditionLabel,
  specValue,
} from "@/lib/compare/compareEngine";
import { useCompareStore, type CompareItem } from "@/store/compareStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useToastStore } from "@/store/toastStore";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import type { ProductSpec } from "@/types/product";
import "@/styles/compare.css";

interface ComparePageProps {
  initialItems?: CompareItem[];
  sharedTitle?: string;
  readOnly?: boolean;
}

export default function ComparePage({
  initialItems,
  sharedTitle,
  readOnly = false,
}: ComparePageProps) {
  const storeItems = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const setItems = useCompareStore((s) => s.setItems);
  const addToCart = useCartStore((s) => s.addItem);
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const wishlistHas = useWishlistStore((s) => s.has);
  const showToast = useToastStore((s) => s.show);

  const items = initialItems ?? storeItems;

  const [specsBySlug, setSpecsBySlug] = useState<Record<string, ProductSpec[]>>({});
  const [conditionsBySlug, setConditionsBySlug] = useState<Record<string, string>>({});
  const [specsLoading, setSpecsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    let cancelled = false;
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

  const specLabels = useMemo(
    () =>
      collectSpecLabels(
        Object.fromEntries(
          Object.entries(specsBySlug).map(([slug, specs]) => [
            slug,
            specs.map((s) => ({ label: s.label, value: s.value })),
          ])
        )
      ),
    [specsBySlug]
  );

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/compare/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Share failed");
      return json.share as { url: string };
    },
    onSuccess: async (share) => {
      setShareUrl(share.url);
      try {
        await navigator.clipboard.writeText(share.url);
        showToast("Share link copied", "success");
      } catch {
        showToast("Share link created", "success");
      }
    },
    onError: (err) => showToast(err instanceof Error ? err.message : "Share failed", "error"),
  });

  function openPrintExport() {
    const slugs = items.map((i) => i.slug).join(",");
    const url = `/api/compare/export/html?slugs=${encodeURIComponent(slugs)}&print=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function saveSharedToMyCompare() {
    if (!initialItems?.length) return;
    setItems(initialItems);
    showToast("Comparison saved to your list", "success");
  }

  function productFromItem(item: CompareItem) {
    return {
      id: item.productId,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      brandSlug: item.brand.toLowerCase().replace(/\s+/g, "-"),
      category: "",
      categorySlug: "",
      price: item.price,
      rating: item.rating,
      reviewCount: item.reviewCount,
      availability: item.availability,
      condition: (conditionsBySlug[item.slug] as "new" | "used" | "open-box") ?? "new",
      imageColor: item.imageColor,
      image: item.image,
    };
  }

  return (
    <main className="storefront-page storefront-page--subtle compare-page">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Compare</p>
        <h1 className="storefront-page__title">
          {sharedTitle ?? "Compare Products"}
        </h1>
        <p className="storefront-page__meta">
          Side-by-side comparison of up to 4 products with specs, pricing, reviews, and availability.
          {readOnly ? " Shared view — save to your list to edit." : " Syncs across devices when signed in."}
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
                      {!readOnly ? (
                        <button
                          type="button"
                          className="compare-table__remove"
                          aria-label={`Remove ${item.name} from compare`}
                          onClick={() => remove(item.productId)}
                        >
                          Remove
                        </button>
                      ) : null}
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
                  values={items.map((i) => conditionLabel(conditionsBySlug[i.slug]))}
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
                    values={items.map((i) =>
                      specValue(
                        Object.fromEntries(
                          Object.entries(specsBySlug).map(([slug, specs]) => [
                            slug,
                            specs.map((s) => ({ label: s.label, value: s.value })),
                          ])
                        ),
                        i.slug,
                        label
                      )
                    )}
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
                {!readOnly ? (
                  <button
                    type="button"
                    className="compare-mobile-card__remove"
                    aria-label={`Remove ${item.name} from compare`}
                    onClick={() => remove(item.productId)}
                  >
                    Remove from compare
                  </button>
                ) : null}
                <dl className="compare-mobile-card__rows">
                  <Row dt="Brand" dd={item.brand} />
                  <Row dt="Price" dd={formatDisplayPrice(item.price)} />
                  <Row dt="Condition" dd={conditionLabel(conditionsBySlug[item.slug])} />
                  <Row
                    dt="Rating"
                    dd={
                      item.reviewCount > 0
                        ? `${item.rating.toFixed(1)} (${item.reviewCount})`
                        : "—"
                    }
                  />
                  <Row dt="Availability" dd={availabilityLabel(item.availability)} />
                  {specLabels.map((label) => (
                    <Row
                      key={label}
                      dt={label}
                      dd={specValue(
                        Object.fromEntries(
                          Object.entries(specsBySlug).map(([slug, specs]) => [
                            slug,
                            specs.map((s) => ({ label: s.label, value: s.value })),
                          ])
                        ),
                        item.slug,
                        label
                      )}
                    />
                  ))}
                </dl>
                <div className="compare-page__actions">
                  {isPurchasablePrice(item.price) ? (
                    <button
                      type="button"
                      className="compare-page__clear compare-page__clear--cart"
                      onClick={() => addToCart(productFromItem(item), 1)}
                    >
                      Add to cart
                    </button>
                  ) : (
                    <NotifyMeButton
                      variant="inline"
                      className="compare-page__clear"
                      productId={item.productId}
                      productSlug={item.slug}
                      productName={item.name}
                    />
                  )}
                  <button
                    type="button"
                    className="compare-page__clear"
                    onClick={() => wishlistToggle(productFromItem(item))}
                  >
                    {wishlistHas(item.productId) ? "In wishlist" : "Add to wishlist"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="compare-page__actions">
            {!readOnly ? (
              <>
                <button
                  type="button"
                  className="compare-page__clear"
                  onClick={() => shareMutation.mutate()}
                  disabled={shareMutation.isPending}
                >
                  {shareMutation.isPending ? "Sharing…" : "Share comparison"}
                </button>
                <button type="button" className="compare-page__clear" onClick={openPrintExport}>
                  Print / Save PDF
                </button>
                <button type="button" className="compare-page__clear" onClick={clear}>
                  Clear all
                </button>
              </>
            ) : (
              <>
                <button type="button" className="compare-page__clear" onClick={saveSharedToMyCompare}>
                  Save to my compare
                </button>
                <Link href={ROUTES.compare} className="compare-page__clear">
                  Open my compare
                </Link>
              </>
            )}
          </div>

          {shareUrl ? (
            <p className="compare-page__share-url">
              Share link: <a href={shareUrl}>{shareUrl}</a>
            </p>
          ) : null}
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

function Row({ dt, dd }: { dt: string; dd: string }) {
  return (
    <div className="compare-mobile-card__row">
      <dt>{dt}</dt>
      <dd>{dd}</dd>
    </div>
  );
}

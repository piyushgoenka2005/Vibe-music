"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import type { RentalCategory, RentalProduct } from "@/types/rental";
import { formatCurrency } from "@/utils/currency";

function dailyFrom(product: RentalProduct): number {
  return product.dailyRate || product.hourlyRate * 24 || product.weeklyRate / 7;
}

export default function RentalsHubPage({
  initialCategorySlug = "",
}: {
  initialCategorySlug?: string;
}) {
  const [category, setCategory] = useState<string>(initialCategorySlug);

  const { data: categoriesData } = useQuery({
    queryKey: ["rental-categories"],
    queryFn: async () => {
      const res = await fetch("/api/rentals/categories");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ categories: RentalCategory[] }>;
    },
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    return params.toString();
  }, [category]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["rental-products", category],
    queryFn: async () => {
      const url = queryString
        ? `/api/rentals/products?${queryString}`
        : "/api/rentals/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ products: RentalProduct[] }>;
    },
  });

  const categories = categoriesData?.categories ?? [];
  const products = productsData?.products ?? [];

  return (
    <main className="storefront-page rentals-page">
      <header className="rentals-hero">
        <p className="rentals-hero__eyebrow">Rentals</p>
        <h1 className="rentals-hero__title">Instrument & pro audio rentals</h1>
        <p className="rentals-hero__subtitle">
          Book keyboards, PA systems, guitars, and studio gear by the hour, day, week, or month.
          Secure deposit, pickup or delivery, and online checkout.
        </p>
      </header>

      {categories.length > 0 ? (
        <nav className="rentals-categories" aria-label="Rental categories">
          <button
            type="button"
            className={`rentals-category-card ${category === "" ? "is-active" : ""}`}
            onClick={() => setCategory("")}
          >
            All gear
          </button>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={ROUTES.rentalCategory(cat.slug)}
              className="rentals-category-card"
              onClick={() => setCategory(cat.slug)}
            >
              {cat.name}
              {typeof cat.productCount === "number" ? ` (${cat.productCount})` : ""}
            </Link>
          ))}
        </nav>
      ) : null}

      {isLoading ? (
        <p className="rentals-empty">Loading rental catalog…</p>
      ) : products.length === 0 ? (
        <p className="rentals-empty">
          Rental catalog is being prepared. Check back soon or{" "}
          <Link href={ROUTES.contact}>contact us</Link> for a quote.
        </p>
      ) : (
        <div className="rentals-grid">
          {products.map((product) => (
            <article key={product.id} className="rentals-product-card">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt=""
                  className="rentals-product-card__image"
                />
              ) : (
                <div className="rentals-product-card__image" aria-hidden />
              )}
              <div className="rentals-product-card__body">
                <h2 className="rentals-product-card__name">
                  <Link href={ROUTES.rentalProduct(product.slug)}>{product.name}</Link>
                </h2>
                <p className="rentals-product-card__meta">
                  {product.categoryName ?? "Rental"} · {product.totalUnits} unit
                  {product.totalUnits === 1 ? "" : "s"}
                </p>
                <p className="rentals-product-card__price">
                  From {formatCurrency(dailyFrom(product))}/day
                </p>
                <Link
                  href={ROUTES.rentalProduct(product.slug)}
                  className="rentals-btn"
                  style={{ marginTop: "0.75rem", width: "fit-content" }}
                >
                  Check availability
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

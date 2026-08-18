"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import type { RentalDurationType, RentalProduct } from "@/types/rental";
import { formatCurrency } from "@/utils/currency";

import ProductImage from "@/components/common/ProductImage";

interface RentalProductPageProps {
  product: RentalProduct;
}

function defaultEnd(start: string, durationType: RentalDurationType): string {
  const date = new Date(start);
  if (durationType === "hourly") date.setHours(date.getHours() + 4);
  else if (durationType === "daily") date.setDate(date.getDate() + 1);
  else if (durationType === "weekly") date.setDate(date.getDate() + 7);
  else date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export default function RentalProductPageClient({ product }: RentalProductPageProps) {
  const router = useRouter();
  const [durationType, setDurationType] = useState<RentalDurationType>("daily");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endAt, setEndAt] = useState(() =>
    defaultEnd(new Date().toISOString(), "daily").slice(0, 16)
  );
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");

  const from = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const to = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data: calendarData } = useQuery({
    queryKey: ["rental-calendar", product.slug, from, to],
    queryFn: async () => {
      const res = await fetch(
        `/api/rentals/products/${product.slug}?from=${from}&to=${to}`
      );
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        calendar: Array<{ date: string; availableUnits: number; isBlocked: boolean }>;
      }>;
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rentals/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          durationType,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          fulfillment,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Quote failed");
      return json.quote as {
        total: number;
        depositAmount: number;
        available: boolean;
        lineSubtotal: number;
      };
    },
  });

  function proceedToCheckout() {
    const params = new URLSearchParams({
      product: product.slug,
      durationType,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      fulfillment,
    });
    router.push(`${ROUTES.rentalCheckout}?${params.toString()}`);
  }

  const calendar = calendarData?.calendar ?? [];

  return (
    <main className="storefront-page rentals-page">
      <Link href={ROUTES.rentals} className="rentals-hero__eyebrow">
        ← Back to rentals
      </Link>
      <div className="rentals-detail" style={{ marginTop: "1rem" }}>
        <div>
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="rentals-detail__image" />
          ) : (
            <div className="rentals-detail__image" aria-hidden />
          )}
        </div>
        <div>
          <p className="rentals-hero__eyebrow">{product.categoryName}</p>
          <h1 className="rentals-hero__title">{product.name}</h1>
          <p className="rentals-hero__subtitle">{product.description}</p>

          <div className="rentals-form" style={{ marginTop: "1.5rem" }}>
            <label>
              Duration type
              <select
                value={durationType}
                onChange={(e) => {
                  const next = e.target.value as RentalDurationType;
                  setDurationType(next);
                  setEndAt(defaultEnd(new Date(startAt).toISOString(), next).slice(0, 16));
                }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              Start
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </label>
            <label>
              Fulfillment
              <select
                value={fulfillment}
                onChange={(e) => setFulfillment(e.target.value as "pickup" | "delivery")}
              >
                {product.pickupAvailable ? <option value="pickup">Pickup</option> : null}
                {product.deliveryAvailable ? <option value="delivery">Delivery</option> : null}
              </select>
            </label>
            <button
              type="button"
              className="rentals-btn rentals-btn--secondary"
              onClick={() => quoteMutation.mutate()}
              disabled={quoteMutation.isPending}
            >
              {quoteMutation.isPending ? "Calculating…" : "Get quote"}
            </button>
          </div>

          {quoteMutation.data ? (
            <div className="rentals-quote" role="status">
              <p>
                Rental: {formatCurrency(quoteMutation.data.lineSubtotal)} · Deposit:{" "}
                {formatCurrency(quoteMutation.data.depositAmount)}
              </p>
              <p>
                <strong>Total due now: {formatCurrency(quoteMutation.data.total)}</strong>
              </p>
              {!quoteMutation.data.available ? (
                <p>Not available for selected dates.</p>
              ) : (
                <button type="button" className="rentals-btn" onClick={proceedToCheckout}>
                  Continue to checkout
                </button>
              )}
            </div>
          ) : null}

          {calendar.length > 0 ? (
            <section style={{ marginTop: "1.5rem" }} aria-label="Availability calendar">
              <h2 className="rentals-hero__eyebrow">60-day availability</h2>
              <div className="rentals-calendar">
                {calendar.map((day) => (
                  <div
                    key={day.date}
                    className={`rentals-calendar__day ${day.isBlocked ? "rentals-calendar__day--blocked" : "rentals-calendar__day--ok"}`}
                    title={`${day.date}: ${day.availableUnits} available`}
                  >
                    {day.date.slice(8)}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

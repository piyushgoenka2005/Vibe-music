"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ROUTES } from "@/lib/routes";
import "@/styles/rentals.css";

function RentalSuccessContent() {
  const params = useSearchParams();
  const bookingId = params.get("booking");
  const token = params.get("token");

  const { data } = useQuery({
    queryKey: ["rental-success", bookingId, token],
    enabled: Boolean(bookingId),
    queryFn: async () => {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/rentals/bookings/${bookingId}${qs}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const booking = data?.booking;

  return (
    <main className="storefront-page rentals-page">
      <h1 className="rentals-hero__title">Rental confirmed</h1>
      {booking ? (
        <>
          <p className="rentals-hero__subtitle">
            Booking {booking.bookingNumber} is {booking.status}. We sent a confirmation to{" "}
            {booking.email}.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <Link href={ROUTES.accountRentals} className="rentals-btn">
              View my rentals
            </Link>
            <a
              href={
                token
                  ? `/api/rentals/invoices/${booking.id}/html?token=${encodeURIComponent(token)}`
                  : `/api/rentals/invoices/${booking.id}/html`
              }
              className="rentals-btn rentals-btn--secondary"
              target="_blank"
              rel="noreferrer"
            >
              Download invoice
            </a>
            <Link href={ROUTES.rentals} className="rentals-btn rentals-btn--secondary">
              Browse more gear
            </Link>
          </div>
        </>
      ) : (
        <p className="rentals-empty">Loading booking details…</p>
      )}
    </main>
  );
}

export default function RentalSuccessPage() {
  return (
    <Suspense fallback={<main className="storefront-page rentals-page"><p>Loading…</p></main>}>
      <RentalSuccessContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import { formatRentalDateRange } from "@/lib/rental/durationUtils";
import "@/styles/rentals.css";

export default function AccountRentalDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const { data, isLoading } = useQuery({
    queryKey: ["account-rental", bookingId],
    enabled: Boolean(bookingId),
    queryFn: async () => {
      const res = await fetch(`/api/rentals/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const booking = data?.booking;

  return (
    <>
      <Link href={ROUTES.accountRentals}>← Back to rentals</Link>
      {isLoading || !booking ? (
        <p style={{ marginTop: "1rem" }}>Loading…</p>
      ) : (
        <div className="rentals-booking-row" style={{ marginTop: "1rem" }}>
          <h1>{booking.bookingNumber}</h1>
          <p>Status: {booking.status}</p>
          <p>Payment: {booking.paymentStatus}</p>
          <p>{formatRentalDateRange(booking.startAt, booking.endAt)}</p>
          <p>Total: {formatCurrency(booking.total)}</p>
          <ul>
            {booking.items.map((item: { id: string; productName: string; quantity: number }) => (
              <li key={item.id}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>
          <a
            href={
              booking.trackingToken
                ? `/api/rentals/invoices/${booking.id}/html?token=${encodeURIComponent(booking.trackingToken)}`
                : `/api/rentals/invoices/${booking.id}/html`
            }
            className="rentals-btn rentals-btn--secondary"
            target="_blank"
            rel="noreferrer"
          >
            Invoice
          </a>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import "@/styles/rentals.css";

export default function AccountRentalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-rentals"],
    queryFn: async () => {
      const res = await fetch("/api/rentals/account/bookings");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const bookings = data?.bookings ?? [];

  return (
    <>
      <h1>My rentals</h1>
      {isLoading ? (
        <p>Loading rentals…</p>
      ) : bookings.length === 0 ? (
        <p>
          No rental bookings yet.{" "}
          <Link href={ROUTES.rentals}>Browse rental gear</Link>
        </p>
      ) : (
        <div className="rentals-booking-list">
          {bookings.map((booking: {
            id: string;
            bookingNumber: string;
            status: string;
            total: number;
            startAt: string;
            endAt: string;
          }) => (
            <article key={booking.id} className="rentals-booking-row">
              <strong>{booking.bookingNumber}</strong>
              <span>{booking.status}</span>
              <span>
                {new Date(booking.startAt).toLocaleDateString("en-IN")} –{" "}
                {new Date(booking.endAt).toLocaleDateString("en-IN")}
              </span>
              <span>{formatCurrency(booking.total)}</span>
              <Link href={ROUTES.accountRental(booking.id)}>View details</Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

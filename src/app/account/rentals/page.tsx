"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import AccountEmptyState from "@/components/account/AccountEmptyState";

type AccountRentalBooking = {
  id: string;
  bookingNumber: string;
  status: string;
  total: number;
  startAt: string;
  endAt: string;
};

function rentalBadgeClass(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("cancel")) return "acct__badge acct__badge--cancelled";
  if (normalized.includes("complete") || normalized.includes("return")) {
    return "acct__badge acct__badge--delivered";
  }
  if (normalized.includes("active") || normalized.includes("confirm")) {
    return "acct__badge acct__badge--confirmed";
  }
  if (normalized.includes("process") || normalized.includes("paid")) {
    return "acct__badge acct__badge--processing";
  }
  if (normalized.includes("ship")) return "acct__badge acct__badge--shipped";
  return "acct__badge acct__badge--pending";
}

function formatRentalDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AccountRentalsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["account-rentals"],
    queryFn: async () => {
      const res = await fetch("/api/rentals/account/bookings");
      if (!res.ok) throw new Error("Unable to load rentals");
      return res.json() as Promise<{ bookings?: AccountRentalBooking[] }>;
    },
  });

  const bookings = data?.bookings ?? [];

  return (
    <div>
      <h1 className="acct__section-title">My Rentals</h1>
      <p className="acct__section-sub">
        Bookings, dates, and status for gear you&apos;ve rented.
      </p>

      <div className="acct__card">
        {isLoading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#666" }}>
            Loading your rentals…
          </p>
        ) : error ? (
          <p role="alert" style={{ padding: 24, color: "#c5221f" }}>
            {error instanceof Error ? error.message : "Unable to load rentals"}
          </p>
        ) : bookings.length === 0 ? (
          <AccountEmptyState
            icon={CalendarDays}
            title="No Rentals Yet"
            description="When you book rental gear, your bookings will show up here with dates and status."
            actionLabel="Browse rental gear"
            actionHref={ROUTES.rentals}
          />
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="acct__order">
              <div className="acct__order-main">
                <p className="acct__order-id">{booking.bookingNumber}</p>
                <p className="acct__order-meta">
                  {formatRentalDate(booking.startAt)} –{" "}
                  {formatRentalDate(booking.endAt)}
                </p>
              </div>
              <span className={rentalBadgeClass(booking.status)}>
                {formatStatusLabel(booking.status)}
              </span>
              <div className="acct__order-summary">
                <p className="acct__order-total">
                  {formatCurrency(booking.total)}
                </p>
                <div className="acct__order-actions">
                  <Link
                    href={ROUTES.accountRental(booking.id)}
                    className="acct__btn acct__btn--secondary acct__btn--sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

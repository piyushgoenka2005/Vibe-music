import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function RentalsHubEmpty() {
  return (
    <div className="rentals-empty-panel" role="status">
      <p className="rentals-empty-panel__lead">
        The rental catalog is being prepared. Admins can add rental products in{" "}
        <Link href={ROUTES.adminRentalProducts}>Admin → Rentals</Link> — they appear here
        automatically.
      </p>
      <ul className="rentals-empty-panel__list">
        <li>Hourly, daily, weekly, and monthly rates</li>
        <li>Secure deposit and online checkout</li>
        <li>Pickup in Kolkata or delivery by quote</li>
      </ul>
      <div className="rentals-empty-panel__actions">
        <Link
          href={`${ROUTES.contact}?subject=${encodeURIComponent("Rental quote enquiry")}`}
          className="rentals-btn"
        >
          Request a rental quote
        </Link>
        <Link href={ROUTES.programs} className="rentals-empty-panel__secondary">
          Explore other programs
        </Link>
      </div>
    </div>
  );
}

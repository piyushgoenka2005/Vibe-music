import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import "@/styles/finance.css";

export const metadata: Metadata = {
  title: "Payments",
  description:
    "Pay securely at Vibe Music with UPI, credit and debit cards, and net banking.",
};

export default function FinancingPage() {
  return (
    <main className="finance-page">
      <section className="rentals-hero finance-hero">
        <h1 className="rentals-hero__title">Payments</h1>
        <p className="rentals-hero__subtitle">
          Pay securely at checkout with UPI, credit and debit cards, and net banking.
          Installment plans are not currently offered.
        </p>
        <div className="finance-hero__actions">
          <Link href={ROUTES.search} className="finance-btn">
            Continue shopping
          </Link>
          <Link href={ROUTES.contact} className="finance-btn finance-btn--ghost">
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}

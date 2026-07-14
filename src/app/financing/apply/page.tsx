import type { Metadata } from "next";
import { Suspense } from "react";
import FinanceApplyPageClient from "@/components/finance/FinanceApplyPageClient";
import "@/styles/finance.css";

export const metadata: Metadata = {
  title: "Apply for Financing",
  description: "Submit a finance application for your Vibe Music gear purchase.",
};

export default function FinancingApplyPage() {
  return (
    <Suspense fallback={<main className="finance-page"><p>Loading…</p></main>}>
      <FinanceApplyPageClient />
    </Suspense>
  );
}

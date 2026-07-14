import type { Metadata } from "next";
import FinancingHubPage from "@/components/finance/FinancingHubPage";
import "@/styles/finance.css";

export const metadata: Metadata = {
  title: "Payments & Financing",
  description:
    "Compare EMI plans, calculate monthly installments, and apply for instrument financing at Vibe Music.",
};

export default function FinancingPage() {
  return <FinancingHubPage />;
}

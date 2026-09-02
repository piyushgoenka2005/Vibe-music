import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Rental Confirmed | ${BRAND.name}`,
  description: "Your instrument rental booking has been confirmed. Check your email for details.",
  robots: { index: false, follow: false },
};

export default function RentalSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}

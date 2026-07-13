import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `My Account | ${BRAND.name}`,
  description: "Manage your Vibe Music account, orders, wishlist, and settings.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="storefront-page storefront-page--subtle">
      <ProtectedRoute>
        <AccountShell>{children}</AccountShell>
      </ProtectedRoute>
    </main>
  );
}

import AccountShell from "@/components/account/AccountShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="storefront-page storefront-page--subtle" id="main-content">
      <ProtectedRoute>
        <AccountShell>{children}</AccountShell>
      </ProtectedRoute>
    </main>
  );
}

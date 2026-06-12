import AccountShell from "@/components/account/AccountShell";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <ProtectedRoute>
          <AccountShell>{children}</AccountShell>
        </ProtectedRoute>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

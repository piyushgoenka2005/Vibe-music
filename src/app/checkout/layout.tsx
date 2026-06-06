import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

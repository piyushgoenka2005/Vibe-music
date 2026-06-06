import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import { BRAND } from "@/lib/brand";

export default function RegisterPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <GuestOnlyRoute>
          <AuthShell
            title="Create Account"
            description={`Join ${BRAND.name} to save your wishlist and track orders.`}
          >
            <Suspense fallback={null}>
              <RegisterForm />
            </Suspense>
          </AuthShell>
        </GuestOnlyRoute>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

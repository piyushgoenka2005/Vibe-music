import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function RegisterPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <GuestOnlyRoute>
          <AuthShell
            title="Create Account"
            description="Join Vibe Music to save your wishlist and track orders."
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

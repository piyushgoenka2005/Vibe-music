import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function LoginPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <GuestOnlyRoute>
          <AuthShell
            title="Log In"
            description="Sign in to access your account, orders, and wishlist."
          >
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </AuthShell>
        </GuestOnlyRoute>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

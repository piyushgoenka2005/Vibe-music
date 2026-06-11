import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function LoginPage() {
  return (
    <>
      <HtmlSection file="header" />
      <AuthPageLayout>
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
      </AuthPageLayout>
      <HtmlSection file="footer" />
    </>
  );
}

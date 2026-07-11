import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";

export default function LoginPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <AuthPageLayout>
      <GuestOnlyRoute>
        <AuthShell
          title="Log In"
          description="Sign in to access your account, orders, and wishlist."
        >
          <Suspense fallback={null}>
            <LoginForm googleAuthEnabled={googleAuthEnabled} />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

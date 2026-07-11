import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";

export default function RegisterPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <AuthPageLayout wide>
      <GuestOnlyRoute>
        <AuthShell
          title="Create Account"
          description="Join Vibe Music to save your wishlist and track orders."
        >
          <Suspense fallback={null}>
            <RegisterForm googleAuthEnabled={googleAuthEnabled} />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

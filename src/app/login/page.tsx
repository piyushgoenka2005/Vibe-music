import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import { getGoogleSignInStatus } from "@/lib/auth/google-config";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Log In | ${BRAND.name}`,
  description: "Sign in to access your account, orders, and wishlist.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

// OAuth availability is read from live env + Google probe — never bake at build time.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const googleSignIn = await getGoogleSignInStatus();
  const googleAuthEnabled = googleSignIn.available;
  const googleAuthUnavailableReason = googleSignIn.reason;

  return (
    <AuthPageLayout>
      <AuthShell title="Log In" description="Sign in to access your account, orders, and wishlist.">
        <GuestOnlyRoute>
          <Suspense fallback={null}>
            <LoginForm
              googleAuthEnabled={googleAuthEnabled}
              googleAuthUnavailableReason={googleAuthUnavailableReason}
            />
          </Suspense>
        </GuestOnlyRoute>
      </AuthShell>
    </AuthPageLayout>
  );
}

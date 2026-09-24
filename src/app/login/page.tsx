import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleAuthConfigured, isGoogleSignInAvailable } from "@/lib/auth/google-config";
import type { GoogleAuthUnavailableReason } from "@/components/auth/GoogleAuthUnavailableNote";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Log In | ${BRAND.name}`,
  description: "Sign in to access your account, orders, and wishlist.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage() {
  const googleConfigured = isGoogleAuthConfigured();
  const googleAuthEnabled = await isGoogleSignInAvailable();
  const googleAuthUnavailableReason: GoogleAuthUnavailableReason | undefined = googleAuthEnabled
    ? undefined
    : googleConfigured
      ? "database"
      : "oauth";

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

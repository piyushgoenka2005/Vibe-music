import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";
import { isGoogleAuthConfigured, isGoogleSignInAvailable } from "@/lib/auth/google-config";
import type { GoogleAuthUnavailableReason } from "@/components/auth/GoogleAuthUnavailableNote";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Create Account | ${BRAND.name}`,
  description: "Join Vibe Music to save your wishlist and track orders.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const googleConfigured = isGoogleAuthConfigured();
  const googleAuthEnabled = await isGoogleSignInAvailable();
  const googleAuthUnavailableReason: GoogleAuthUnavailableReason | undefined = googleAuthEnabled
    ? undefined
    : googleConfigured
      ? "database"
      : "oauth";

  return (
    <AuthPageLayout wide>
      <GuestOnlyRoute>
        <AuthShell
          title="Create Account"
          description="Join Vibe Music to save your wishlist and track orders."
        >
          <Suspense fallback={null}>
            <RegisterForm
              googleAuthEnabled={googleAuthEnabled}
              googleAuthUnavailableReason={googleAuthUnavailableReason}
            />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleAuthConfigured } from "@/lib/auth/google-config";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Log In | ${BRAND.name}`,
  description: "Sign in to access your account, orders, and wishlist.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  const googleAuthEnabled = isGoogleAuthConfigured();

  return (
    <AuthPageLayout>
      <AuthShell
        title="Log In"
        description="Sign in to access your account, orders, and wishlist."
      >
        <GuestOnlyRoute>
          <Suspense fallback={null}>
            <LoginForm googleAuthEnabled={googleAuthEnabled} />
          </Suspense>
        </GuestOnlyRoute>
      </AuthShell>
    </AuthPageLayout>
  );
}

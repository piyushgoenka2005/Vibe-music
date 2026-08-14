import { Suspense } from "react";
import type { Metadata } from "next";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout>
      <GuestOnlyRoute>
        <AuthShell
          title="Choose a new password"
          description="Enter a strong password for your account."
        >
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

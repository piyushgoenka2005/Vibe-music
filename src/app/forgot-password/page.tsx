import { Suspense } from "react";
import type { Metadata } from "next";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout>
      <GuestOnlyRoute>
        <AuthShell
          title="Forgot Password"
          description="Enter your email and we'll send you a link to reset your password."
        >
          <Suspense fallback={null}>
            <ForgotPasswordForm />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

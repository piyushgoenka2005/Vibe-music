import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import HtmlSection from "@/components/vibe/HtmlSection";

export default function ForgotPasswordPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
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
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

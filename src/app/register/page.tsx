import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import GuestOnlyRoute from "@/components/auth/GuestOnlyRoute";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthPageLayout wide>
      <GuestOnlyRoute>
        <AuthShell
          title="Create Account"
          description="Join Vibe Music to save your wishlist and track orders."
        >
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </AuthShell>
      </GuestOnlyRoute>
    </AuthPageLayout>
  );
}

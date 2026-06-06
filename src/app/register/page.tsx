import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";
import HtmlSection from "@/components/sweetwater/HtmlSection";

export default function RegisterPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <AuthLayout
          title="Create Account"
          subtitle="Join Sweetwater to save your wishlist and track orders."
        >
          <Suspense fallback={null}>
            <RegisterForm />
          </Suspense>
        </AuthLayout>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import HtmlSection from "@/components/sweetwater/HtmlSection";

export default function LoginPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <AuthLayout
          title="Log In"
          subtitle="Sign in to access your account, orders, and wishlist."
        >
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </AuthLayout>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

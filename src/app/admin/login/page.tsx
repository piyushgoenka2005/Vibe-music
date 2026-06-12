import { Suspense } from "react";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import AuthShell from "@/components/auth/AuthShell";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import HtmlSection from "@/components/vibe/HtmlSection";

export const metadata = {
  title: "Admin Login | Vibe Music",
};

export default function AdminLoginPage() {
  return (
    <>
      <HtmlSection file="header" />
      <AuthPageLayout>
        <AuthShell
          title="Admin Login"
          description="Authorized personnel only. Customer accounts cannot access this area."
          trustItems={[
            "Secure admin access",
            "Role-based permissions",
            "Activity logging",
          ]}
        >
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </AuthShell>
      </AuthPageLayout>
      <HtmlSection file="footer" />
    </>
  );
}

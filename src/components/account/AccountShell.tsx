import HtmlSection from "@/components/vibe/HtmlSection";
import AccountDashboardLayout from "./AccountDashboardLayout";

interface AccountShellProps {
  children: React.ReactNode;
}

export default function AccountShell({ children }: AccountShellProps) {
  return (
    <>
      <AccountDashboardLayout>{children}</AccountDashboardLayout>
      <HtmlSection file="footer" />
    </>
  );
}

import HtmlSection from "@/components/vibe/HtmlSection";
import AccountDashboardLayout from "./AccountDashboardLayout";

interface AccountShellProps {
  children: React.ReactNode;
}

export default function AccountShell({ children }: AccountShellProps) {
  return (
    <>
      <HtmlSection file="header" />
      <AccountDashboardLayout>{children}</AccountDashboardLayout>
      <HtmlSection file="footer" />
    </>
  );
}

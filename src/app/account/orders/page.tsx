import type { Metadata } from "next";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import AccountOrdersContent from "@/components/account/AccountOrdersContent";
import { pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("Orders"),
};

export default function AccountOrdersPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <AccountOrdersContent />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

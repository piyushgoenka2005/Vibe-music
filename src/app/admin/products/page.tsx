import type { Metadata } from "next";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import AdminProductsContent from "@/components/admin/AdminProductsContent";
import { pageTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: pageTitle("Admin Products"),
};

export default function AdminProductsPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <AdminProductsContent />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

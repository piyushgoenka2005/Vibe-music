import HtmlSection from "@/components/sweetwater/HtmlSection";
import AdminNav from "@/components/admin/AdminNav";
import { ROUTES } from "@/lib/routes";

export default function AdminOrdersPage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Orders</h1>
          <AdminNav active={ROUTES.adminOrders} />
          <p style={{ color: "#807f7e" }}>Admin order management will appear here.</p>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

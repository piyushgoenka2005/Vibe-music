import HtmlSection from "@/components/vibe/HtmlSection";
import AdminNav from "@/components/admin/AdminNav";
import { ROUTES } from "@/lib/routes";

function AdminSection({ title, active }: { title: string; active: string }) {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>{title}</h1>
          <AdminNav active={active} />
          <p style={{ color: "#807f7e" }}>Admin tools for {title.toLowerCase()} will appear here.</p>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

export default function AdminProductsPage() {
  return <AdminSection title="Products" active={ROUTES.adminProducts} />;
}

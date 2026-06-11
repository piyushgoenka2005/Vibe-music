import HtmlSection from "@/components/vibe/HtmlSection";
import AdminNav from "@/components/admin/AdminNav";
import { ROUTES } from "@/lib/routes";

export default function AdminReviewsPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Reviews</h1>
          <AdminNav active={ROUTES.adminReviews} />
          <p style={{ color: "#807f7e" }}>Admin review moderation will appear here.</p>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

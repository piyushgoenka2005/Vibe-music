import HtmlSection from "@/components/sweetwater/HtmlSection";
import AccountNav from "@/components/account/AccountNav";
import { ROUTES } from "@/lib/routes";

export default function AccountOrdersPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section
          className="personalization-widgets"
          style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}
        >
          <h2 className="personalization-widgets__greeting">Order History</h2>
          <AccountNav active={ROUTES.accountOrders} />
          <p style={{ color: "#807f7e" }}>
            You have no orders yet. Items you purchase will appear here.
          </p>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

import HtmlSection from "@/components/sweetwater/HtmlSection";
import AccountNav from "@/components/account/AccountNav";
import AccountProfileContent from "@/components/account/AccountProfileContent";
import { ROUTES } from "@/lib/routes";

export default function AccountProfilePage() {
  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <section
          className="personalization-widgets"
          style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}
        >
          <h2 className="personalization-widgets__greeting">Profile & Settings</h2>
          <AccountNav active={ROUTES.accountProfile} />
          <AccountProfileContent />
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

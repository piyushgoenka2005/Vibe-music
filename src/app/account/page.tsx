import Link from "next/link";
import HtmlSection from "@/components/vibe/HtmlSection";
import AccountNav from "@/components/account/AccountNav";
import AccountWishlist from "@/components/wishlist/AccountWishlist";
import { ROUTES } from "@/lib/routes";

export default function AccountPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section
          className="personalization-widgets"
          style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}
        >
          <h2 className="personalization-widgets__greeting">My Account</h2>
          <AccountNav active={ROUTES.account} />
          <p style={{ color: "#807f7e", marginBottom: 16 }}>
            Manage your orders, profile, and wishlist.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <Link href={ROUTES.accountOrders} style={{ color: "#0072ba", fontWeight: 700 }}>
              View Orders
            </Link>
            <Link href={ROUTES.accountProfile} style={{ color: "#0072ba", fontWeight: 700 }}>
              Edit Profile
            </Link>
            <Link href={ROUTES.accountWishlist} style={{ color: "#0072ba", fontWeight: 700 }}>
              Open Wishlist
            </Link>
          </div>
          <AccountWishlist />
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

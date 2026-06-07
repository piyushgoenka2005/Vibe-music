import HtmlSection from "@/components/vibe/HtmlSection";
import AccountNav from "@/components/account/AccountNav";
import WishlistPage from "@/components/wishlist/WishlistPage";
import { ROUTES } from "@/lib/routes";

export default function AccountWishlistPage() {
  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
          <AccountNav active={ROUTES.accountWishlist} />
          <WishlistPage />
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}

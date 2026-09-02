import type { Metadata } from "next";
import WishlistSharePage from "@/components/wishlist/WishlistSharePage";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";
import "@/styles/storefront-pages.css";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "View a shared wishlist at Vibe Music.",
};

export default async function WishlistShareRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return withServerPageError(async () => {
    const { token } = await params;
    return <WishlistSharePage token={token} />;
  }, "Wishlist");
}

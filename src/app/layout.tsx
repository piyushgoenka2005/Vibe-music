import type { Metadata } from "next";
import { primaryFont } from "@/lib/fonts";
import NavbarCart from "@/components/cart/NavbarCart";
import AuthProvider from "@/components/auth/AuthProvider";
import NavbarAuth from "@/components/auth/NavbarAuth";
import ToastContainer from "@/components/common/ToastContainer";
import GlobalSearch from "@/components/search/GlobalSearch";
import NavbarWishlist from "@/components/wishlist/NavbarWishlist";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import HtmlLinkInterceptor from "@/components/vibe/HtmlLinkInterceptor";
import QueryProvider from "@/providers/QueryProvider";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/typography.css";
import "@/styles/site-layout.css";
import "@/styles/social-rail.css";
import "@/styles/help-widget.css";
import "@/styles/outlet-story.css";
import "@/styles/premium-home.css";
import "@/styles/category-bento.css";
import "@/styles/service-status-carousel.css";
import "@/styles/why-shop-section.css";
import "@/styles/browse-category-cards.css";
import "@/styles/gear-stories.css";
import "@/styles/hero-marquee.css";
import "@/styles/homepage-sections.css";
import "@/styles/premium-product-carousel.css";
import "@/styles/storefront-pages.css";
import "@/styles/buttons.css";
import "@/components/homepage/homepage-dynamic.css";

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={primaryFont.variable}>
      <body className={primaryFont.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <StorefrontChrome>
              <HtmlLinkInterceptor />
              <GlobalSearch />
              <NavbarWishlist />
              <NavbarCart />
              <NavbarAuth />
              <ToastContainer />
              {children}
            </StorefrontChrome>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

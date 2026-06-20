import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { primaryFont } from "@/lib/fonts";
import AuthProvider from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/common/ToastContainer";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import QueryProvider from "@/providers/QueryProvider";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/typography.css";
import "@/styles/site-layout.css";
import "@/styles/site-footer.css";
import "@/styles/social-rail.css";
import "@/styles/help-widget.css";
import "@/styles/storefront-pages.css";
import "@/styles/buttons.css";

const GlobalSearch = dynamic(() => import("@/components/search/GlobalSearch"), {
  loading: () => null,
});

const NavbarWishlist = dynamic(() => import("@/components/wishlist/NavbarWishlist"), {
  loading: () => null,
});

const NavbarCart = dynamic(() => import("@/components/cart/NavbarCart"), {
  loading: () => null,
});

const NavbarAuth = dynamic(() => import("@/components/auth/NavbarAuth"), {
  loading: () => null,
});

const HtmlLinkInterceptor = dynamic(
  () => import("@/components/vibe/HtmlLinkInterceptor"),
  { loading: () => null }
);

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

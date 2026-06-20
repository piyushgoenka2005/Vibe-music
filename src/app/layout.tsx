import type { Metadata } from "next";
import { primaryFont } from "@/lib/fonts";
import NavbarCart from "@/components/cart/NavbarCart";
import AuthProvider from "@/components/auth/AuthProvider";
import NavbarAuth from "@/components/auth/NavbarAuth";
import ToastContainer from "@/components/common/ToastContainer";
import DeferredGlobalSearch from "@/components/layout/DeferredGlobalSearch";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import DeferredHtmlLinkInterceptor from "@/components/vibe/DeferredHtmlLinkInterceptor";
import NavbarWishlist from "@/components/wishlist/NavbarWishlist";
import QueryProvider from "@/providers/QueryProvider";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";
import "@/styles/typography.css";
import "@/styles/site-layout.css";
import "@/styles/site-footer.css";
import "@/styles/social-rail.css";
import "@/styles/help-widget.css";
import "@/styles/storefront-pages.css";
import "@/styles/buttons.css";

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
              <DeferredHtmlLinkInterceptor />
              <DeferredGlobalSearch />
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

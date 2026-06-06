import type { Metadata } from "next";
import NavbarCart from "@/components/cart/NavbarCart";
import AuthProvider from "@/components/auth/AuthProvider";
import NavbarAuth from "@/components/auth/NavbarAuth";
import BrandPatcher from "@/components/brand/BrandPatcher";
import CookieConsent from "@/components/common/CookieConsent";
import ToastContainer from "@/components/common/ToastContainer";
import GlobalSearch from "@/components/search/GlobalSearch";
import NavbarWishlist from "@/components/wishlist/NavbarWishlist";
import HeaderInitializer from "@/components/sweetwater/HeaderInitializer";
import HeaderMenuController from "@/components/sweetwater/HeaderMenuController";
import FooterEnhancer from "@/components/brand/FooterEnhancer";
import HtmlLinkInterceptor from "@/components/sweetwater/HtmlLinkInterceptor";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import QueryProvider from "@/providers/QueryProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, pageTitle } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: pageTitle(),
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: pageTitle(),
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle(),
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vibemusic-header.css" />
        <link rel="stylesheet" href="/sweetwater-inline.css" />
        <link rel="stylesheet" href="/sweetwater-app.css" />
        <link rel="stylesheet" href="/sweetwater-footer.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <HeaderInitializer />
            <HeaderMenuController />
            <HtmlLinkInterceptor />
            <BrandPatcher />
            <FooterEnhancer />
            <GlobalSearch />
            <NavbarWishlist />
            <NavbarCart />
            <NavbarAuth />
            <CookieConsent />
            <ToastContainer />
            <HtmlSection file="header" />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

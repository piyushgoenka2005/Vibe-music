import type { Metadata } from "next";
import NavbarCart from "@/components/cart/NavbarCart";
import ToastContainer from "@/components/common/ToastContainer";
import GlobalSearch from "@/components/search/GlobalSearch";
import NavbarWishlist from "@/components/wishlist/NavbarWishlist";
import HeaderInitializer from "@/components/sweetwater/HeaderInitializer";
import HtmlLinkInterceptor from "@/components/sweetwater/HtmlLinkInterceptor";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sweetwater: Musical Instruments, Pro Audio, Accessories & More",
  description:
    "Sweetwater is the world's leading music technology and instrument retailer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="https://media.sweetwater.com/m/fonts/aspira/aspira_demi/Aspira-Demi.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/sweetwater-inline.css" />
        <link rel="stylesheet" href="/sweetwater-app.css" />
        <link rel="stylesheet" href="/sweetwater-footer.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <link
          rel="stylesheet"
          href="https://assets.sweetwater.com/static/embed/federated-search.css"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>
            <HeaderInitializer />
          <HtmlLinkInterceptor />
          <GlobalSearch />
          <NavbarWishlist />
          <NavbarCart />
          <ToastContainer />
          {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

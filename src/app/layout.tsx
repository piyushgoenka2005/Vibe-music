import type { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import Footer from "@/components/layout/Footer/Footer";
import Header from "@/components/layout/Header/Header";
import ToastContainer from "@/components/common/ToastContainer";
import GlobalSearch from "@/components/search/GlobalSearch";
import HtmlLinkInterceptor from "@/components/vibe/HtmlLinkInterceptor";
import QueryProvider from "@/providers/QueryProvider";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <link
          rel="preload"
          href="https://cdn.vibemusic.in/m/fonts/aspira/aspira_demi/Aspira-Demi.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/vibe-inline.css" />
        <link rel="stylesheet" href="/vibe-header-parity.css" />
        <link rel="stylesheet" href="/vibe-header-black-bar.css" />
        <link rel="stylesheet" href="/vibe-app.css" />
        <link rel="stylesheet" href="/vibe-footer.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <HtmlLinkInterceptor />
            <GlobalSearch />
            <Header />
            <ToastContainer />
            {children}
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

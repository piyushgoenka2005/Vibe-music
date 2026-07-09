import type { Metadata, Viewport } from "next";
import { primaryFont } from "@/lib/fonts";
import AppShell from "@/components/layout/AppShell";
import SocialRailGate from "@/components/layout/SocialRailGate";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";
import "@/styles/typography.css";
import "@/styles/gooey-linkup.css";
import "@/styles/marquee.css";
import "@/styles/site-layout.css";
import "@/styles/social-rail.css";
import "@/styles/site-footer.css";
import "@/styles/storefront-pages.css";
import "@/styles/mobile-storefront.css";
import "@/styles/responsive-utilities.css";
import "@/styles/buttons.css";

export const metadata: Metadata = DEFAULT_METADATA;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={primaryFont.variable} suppressHydrationWarning>
      <body className={primaryFont.className} suppressHydrationWarning>
        <SocialRailGate />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

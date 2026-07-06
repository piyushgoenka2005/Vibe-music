import type { Metadata } from "next";
import { primaryFont } from "@/lib/fonts";
import AppShell from "@/components/layout/AppShell";
import { DEFAULT_METADATA } from "@/lib/site";
import "./globals.css";
import "@/styles/typography.css";
import "@/styles/gooey-linkup.css";
import "@/styles/marquee.css";
import "@/styles/site-layout.css";
import "@/styles/site-footer.css";
import "@/styles/storefront-pages.css";
import "@/styles/buttons.css";

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={primaryFont.variable} suppressHydrationWarning>
      <body className={primaryFont.className} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

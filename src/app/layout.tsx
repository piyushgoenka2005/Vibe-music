import type { Metadata } from "next";
import { primaryFont } from "@/lib/fonts";
import AppShell from "@/components/layout/AppShell";
import { DEFAULT_METADATA } from "@/lib/site";
import { STOREFRONT_THEME_BOOT_SCRIPT } from "@/lib/storefrontThemeScript";
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
    <html
      lang="en-IN"
      className={primaryFont.variable}
      data-storefront-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: STOREFRONT_THEME_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className={primaryFont.className} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

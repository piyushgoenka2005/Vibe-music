import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import { primaryFont } from "@/lib/fonts";
import AppShell from "@/components/layout/AppShell";
import GoogleAnalyticsScripts from "@/components/analytics/GoogleAnalyticsScripts";
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
import "@/styles/notify-me.css";
import "@/styles/page-load-splash.css";

const splashBootFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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
  const splashEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH !== "false";

  return (
    <html lang="en-IN" className={primaryFont.variable} suppressHydrationWarning>
      <head>
        {splashEnabled ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(sessionStorage.getItem("vibe-splash-seen")==="1")return;}catch(e){}document.documentElement.classList.add("vibe-splash-pending");})();`,
            }}
          />
        ) : null}
      </head>
      <body className={primaryFont.className} suppressHydrationWarning>
        <GoogleAnalyticsScripts />
        {splashEnabled ? (
          /* Instant framed brand cover — CSS hides unless html.vibe-splash-pending. */
          <div
            id="vibe-boot-splash"
            className="vibe-boot-splash"
            aria-hidden="true"
          >
            <div className="page-load-splash__frame page-load-splash__frame--settled">
              <span
                className={`page-load-splash__text page-load-splash__text--settled ${splashBootFont.className}`}
              >
                VIBE MUSIC
              </span>
            </div>
          </div>
        ) : null}
        <SocialRailGate />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { primaryFont } from "@/lib/fonts";
import AppShell from "@/components/layout/AppShell";
import { resolvePublicLegal } from "@/lib/brand/resolvePublicLegal";
import brandsCatalog from "@/data/catalog/brands.json";
import { buildBrandsMegaMenu } from "@/lib/navigation/buildBrandsMegaMenu";
import { loadBrandsWithCounts } from "@/lib/server/brandsPageLoader";
import { resolveStoreShippingPolicy } from "@/lib/storefront/resolveStoreShippingPolicy";
import GoogleAnalyticsScripts from "@/components/analytics/GoogleAnalyticsScripts";
import MetaPixelScripts from "@/components/analytics/MetaPixelScripts";
import { getMetaDomainVerification, isMetaPixelConfigured } from "@/lib/analytics/metaPixel";
import SocialRailShell from "@/components/layout/SocialRailShell";
import AppProviders from "@/providers/AppProviders";
import { DEFAULT_METADATA } from "@/lib/site";
import StorefrontSplashRoot from "@/components/layout/StorefrontSplashRoot";
import VibeBootSplashMarkup from "@/components/layout/VibeBootSplashMarkup";
import { isPageLoadSplashEnabled } from "@/lib/splash/pageLoadSplash";
import { buildSplashBootInlineScript } from "@/lib/splash/splashBootInlineScript";
import { buildDevConsoleFilterInlineScript } from "@/lib/dev/devConsoleNoise";
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
import "@/styles/mobile-site-wide.css";
import "@/styles/buttons.css";
import "@/styles/notify-me.css";
import "@/styles/page-load-splash.css";

export const metadata: Metadata = DEFAULT_METADATA;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const isProd = process.env.NODE_ENV === "production";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [legal, shippingPolicy, brands] = await Promise.all([
    resolvePublicLegal(),
    resolveStoreShippingPolicy(),
    loadBrandsWithCounts(),
  ]);
  const brandsMegaMenu = buildBrandsMegaMenu(
    brands.length > 0 ? brands : brandsCatalog.map((brand) => ({ ...brand, productCount: 0 })),
  );
  const splashEnabled = isPageLoadSplashEnabled();
  const metaDomainVerification = getMetaDomainVerification();

  return (
    <html lang="en-IN" className={primaryFont.variable} suppressHydrationWarning>
      <head>
        {!isProd ? (
          <script
            dangerouslySetInnerHTML={{
              __html: buildDevConsoleFilterInlineScript(),
            }}
          />
        ) : null}
        {/* Resource hints for faster third-party connections */}
        <link rel="preconnect" href="https://cdn.vibemusic.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.vibemusic.in" />
        <link rel="preconnect" href="https://checkout.razorpay.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {isMetaPixelConfigured() ? (
          <>
            <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://connect.facebook.net" />
          </>
        ) : null}
        {splashEnabled ? (
          <script
            dangerouslySetInnerHTML={{
              __html: buildSplashBootInlineScript(),
            }}
          />
        ) : null}
        <MetaPixelScripts />
        {metaDomainVerification ? (
          <meta name="facebook-domain-verification" content={metaDomainVerification} />
        ) : null}
      </head>
      <body className={primaryFont.className} suppressHydrationWarning>
        <GoogleAnalyticsScripts />
        {/* Always mount — stable SSR/hydration tree; visibility via html.vibe-splash-pending CSS. */}
        <div
          id="vibe-boot-splash"
          className="vibe-boot-splash"
          aria-hidden="true"
          suppressHydrationWarning
          data-splash-enabled={splashEnabled ? "true" : "false"}
        >
          <VibeBootSplashMarkup />
        </div>
        <StorefrontSplashRoot />
        <Suspense fallback={null}>
          <SocialRailShell />
        </Suspense>
        {legal.gstin ? (
          <p className="sr-only" aria-hidden="true">
            GSTIN: {legal.gstin}
          </p>
        ) : null}
        <AppProviders>
          <AppShell
            legal={legal}
            shippingAnnouncement={shippingPolicy.announcement}
            brandsMegaMenu={brandsMegaMenu}
          >
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}

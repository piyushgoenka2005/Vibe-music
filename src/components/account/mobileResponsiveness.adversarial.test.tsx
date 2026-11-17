import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CurrencyLocaleSelector from "../layout/CurrencyLocaleSelector";

describe("Adversarial Probes: Mobile Responsiveness, Viewports & Drawer Traps", () => {
  const accountCssPath = path.resolve(process.cwd(), "src/components/account/account.css");
  const currencyCssPath = path.resolve(process.cwd(), "src/components/layout/currencyLocale.css");
  const audioCssPath = path.resolve(
    process.cwd(),
    "src/components/product/audio-preview-player.css",
  );
  const mobileDrawerPath = path.resolve(
    process.cwd(),
    "src/components/layout/SiteHeaderMobileDrawer.tsx",
  );
  const mobileNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/SiteHeaderMobileNav.tsx",
  );

  const accountCss = fs.readFileSync(accountCssPath, "utf-8");
  const currencyCss = fs.readFileSync(currencyCssPath, "utf-8");
  const audioCss = fs.readFileSync(audioCssPath, "utf-8");
  const mobileDrawerSource = fs.readFileSync(mobileDrawerPath, "utf-8");
  const mobileNavSource = fs.readFileSync(mobileNavPath, "utf-8");

  it("verifies mobile drawer touch targets meet accessibility criteria (>=44px)", () => {
    // Currency & locale selects in mobile drawer
    expect(currencyCss).toContain("min-height: 44px");

    // Audio player interactive buttons
    expect(audioCss).toContain("min-height: 48px");
  });

  it("probes mobile viewport bounds (<768px): desktop utility header locale is strictly hidden", () => {
    // Checks that .site-header__utility-locale is display: none under @media (max-width: 767px)
    const mediaMatch767 = currencyCss.match(/@media\s*\(max-width:\s*767px\)\s*\{([^}]+)\}/s);
    expect(mediaMatch767).not.toBeNull();
    const mediaContent = mediaMatch767![1];
    expect(mediaContent).toContain(".site-header__utility-locale");
    expect(mediaContent).toContain("display: none");
  });

  it("probes mobile viewport bounds (<640px): audio player switches to single-column and scrolls cleanly", () => {
    const mediaStartIndex = audioCss.indexOf("@media (max-width: 639px)");
    expect(mediaStartIndex).toBeGreaterThan(-1);
    const mediaContent = audioCss.slice(mediaStartIndex);

    // Single column tracklist to prevent horizontal blowout on small screens
    expect(mediaContent).toContain("grid-template-columns: 1fr");
    // Vertical overflow containment
    expect(mediaContent).toContain("overflow-y: auto");
    expect(mediaContent).toContain("justify-content: center");
    expect(mediaContent).toContain("width: 100%");
  });

  it("verifies mobile z-index stacking hierarchy strictly protects drawers from account bar collision", () => {
    // 1. Check .acct__mobile-nav baseline z-index
    const acctNavMatch = accountCss.match(/\.acct__mobile-nav\s*\{([^}]+)\}/s);
    expect(acctNavMatch).not.toBeNull();
    const zIndexMatch = acctNavMatch![1].match(/z-index:\s*(\d+)/);
    expect(zIndexMatch).not.toBeNull();
    const acctZIndex = parseInt(zIndexMatch![1], 10);

    // Baseline MUST be 350, strictly below 380 (drawer backdrop) and 390 (drawer panel)
    expect(acctZIndex).toBe(350);
    expect(acctZIndex).toBeLessThan(380);
    expect(acctZIndex).toBeLessThan(390);

    // 2. Check suppression selectors for active drawers and modal dialogs
    expect(accountCss).toContain("body:has(.cart-drawer--open) .acct__mobile-nav");
    expect(accountCss).toContain("body:has(.cart-drawer) .acct__mobile-nav");
    expect(accountCss).toContain("body.cart-open .acct__mobile-nav");
    expect(accountCss).toContain("body:has(.wl-drawer--open) .acct__mobile-nav");
    expect(accountCss).toContain("body:has(.wl-drawer) .acct__mobile-nav");
    expect(accountCss).toContain("body.wl-open .acct__mobile-nav");
    expect(accountCss).toContain("body.drawer-open .acct__mobile-nav");
    expect(accountCss).toContain("body.site-nav-open .acct__mobile-nav");
    expect(accountCss).toContain('body:has([role="dialog"][aria-modal="true"]) .acct__mobile-nav');
    expect(accountCss).toContain("display: none !important");
  });

  it("audits SiteHeaderMobileDrawer for touch traps, backdrop dismiss, and accessibility dialog contracts", () => {
    // Verifies portal renders backdrop button for closing drawer
    expect(mobileDrawerSource).toContain(
      'className="site-header__backdrop site-header__backdrop--portaled"',
    );
    expect(mobileDrawerSource).toContain('aria-label="Close menu"');
    expect(mobileDrawerSource).toContain("onClick={onClose}");

    // Verifies navigation drawer container attributes
    expect(mobileDrawerSource).toContain('id="site-header-mobile-nav"');
    expect(mobileDrawerSource).toContain('role="dialog"');
    expect(mobileDrawerSource).toContain('aria-modal="true"');
    expect(mobileDrawerSource).toContain('aria-label="Shop categories"');
  });

  it("audits mobile currency selector integration in Mobile Nav footer", () => {
    // Verifies CurrencyLocaleSelector is rendered in SiteHeaderMobileNav footer
    expect(mobileNavSource).toContain(
      '<CurrencyLocaleSelector variant="mobile" onSelect={handleNavigate} />',
    );
    expect(mobileNavSource).toContain("site-header__mobile-nav-footer");
  });

  it("audits DOM ID uniqueness for mobile currency and locale selectors", () => {
    const singleSelectorHtml = renderToStaticMarkup(<CurrencyLocaleSelector variant="mobile" />);
    const currencyIdMatches = singleSelectorHtml.match(/id="vibe-mobile-currency-select"/g);
    const localeIdMatches = singleSelectorHtml.match(/id="vibe-mobile-locale-select"/g);

    // Within a single component instance, IDs must be unique
    expect(currencyIdMatches).toHaveLength(1);
    expect(localeIdMatches).toHaveLength(1);
  });
});

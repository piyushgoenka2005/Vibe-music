import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Mobile Z-Index & Layering Hierarchy — Empirical Stress Harness", () => {
  const rootDir = process.cwd();
  const accountCss = fs.readFileSync(
    path.join(rootDir, "src/components/account/account.css"),
    "utf-8",
  );
  const cartCss = fs.readFileSync(path.join(rootDir, "src/components/cart/cart.css"), "utf-8");
  const wishlistCss = fs.readFileSync(
    path.join(rootDir, "src/components/wishlist/wishlist.css"),
    "utf-8",
  );

  function extractZIndex(css: string, selectorRegex: RegExp): number {
    const match = css.match(selectorRegex);
    if (!match || !match[1]) {
      throw new Error(`Could not find z-index for pattern ${selectorRegex}`);
    }
    return parseInt(match[1], 10);
  }

  describe("1. Strict Numerical Z-Index Stacking Hierarchy", () => {
    it("verifies .acct__mobile-nav z-index is exactly 350", () => {
      const zIndex = extractZIndex(accountCss, /\.acct__mobile-nav\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(zIndex).toBe(350);
    });

    it("verifies cart drawer overlay (380) and drawer panel (390) z-indexes", () => {
      const overlayZ = extractZIndex(cartCss, /\.cart-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s);
      const drawerZ = extractZIndex(cartCss, /\.cart-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);

      expect(overlayZ).toBe(380);
      expect(drawerZ).toBe(390);
    });

    it("verifies wishlist drawer overlay (380) and drawer panel (390) z-indexes", () => {
      const overlayZ = extractZIndex(
        wishlistCss,
        /\.wl-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s,
      );
      const drawerZ = extractZIndex(wishlistCss, /\.wl-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);

      expect(overlayZ).toBe(380);
      expect(drawerZ).toBe(390);
    });

    it("mathematically verifies mobile nav stays strictly below backdrops and drawers", () => {
      const acctNavZ = extractZIndex(accountCss, /\.acct__mobile-nav\s*\{[^}]*?z-index:\s*(\d+)/s);
      const cartOverlayZ = extractZIndex(
        cartCss,
        /\.cart-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s,
      );
      const cartDrawerZ = extractZIndex(cartCss, /\.cart-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);
      const wlOverlayZ = extractZIndex(
        wishlistCss,
        /\.wl-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s,
      );
      const wlDrawerZ = extractZIndex(wishlistCss, /\.wl-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);

      expect(acctNavZ).toBeLessThan(cartOverlayZ);
      expect(acctNavZ).toBeLessThan(cartDrawerZ);
      expect(acctNavZ).toBeLessThan(wlOverlayZ);
      expect(acctNavZ).toBeLessThan(wlDrawerZ);

      // Verify strict order: 350 < 380 < 390
      expect(acctNavZ).toBe(350);
      expect(cartOverlayZ).toBe(380);
      expect(cartDrawerZ).toBe(390);
    });
  });

  describe("2. Fixed Positioning & Root Stacking Context", () => {
    it("confirms all drawer overlays and bottom nav have position: fixed", () => {
      expect(accountCss).toMatch(/\.acct__mobile-nav\s*\{[^}]*?position:\s*fixed/s);
      expect(cartCss).toMatch(/\.cart-drawer\s*\{[^}]*?position:\s*fixed/s);
      expect(cartCss).toMatch(/\.cart-drawer-overlay\s*\{[^}]*?position:\s*fixed/s);
      expect(wishlistCss).toMatch(/\.wl-drawer\s*\{[^}]*?position:\s*fixed/s);
      expect(wishlistCss).toMatch(/\.wl-drawer-overlay\s*\{[^}]*?position:\s*fixed/s);
    });
  });

  describe("3. CSS :has and Class-Based Trigger Matrix", () => {
    const requiredSuppressionTriggers = [
      "body:has(.cart-drawer--open) .acct__mobile-nav",
      "body.cart-open .acct__mobile-nav",
      "body:has(.cart-drawer) .acct__mobile-nav",
      "body:has(.wl-drawer--open) .acct__mobile-nav",
      "body:has(.wl-drawer) .acct__mobile-nav",
      "body.wl-open .acct__mobile-nav",
      "body.drawer-open .acct__mobile-nav",
      "body.site-nav-open .acct__mobile-nav",
      'body:has([role="dialog"][aria-modal="true"]) .acct__mobile-nav',
    ];

    it("verifies all 9 suppression triggers are declared in account.css with display: none !important", () => {
      for (const trigger of requiredSuppressionTriggers) {
        expect(accountCss).toContain(trigger);
      }

      // Check declaration block contains display: none !important
      const suppressionBlock = accountCss.match(
        /body:has\(\.cart-drawer--open\)[\s\S]*?\{([^}]*)\}/,
      );
      expect(suppressionBlock).not.toBeNull();
      expect(suppressionBlock![1]).toContain("display: none !important");
    });

    it("verifies CartDrawer component DOM attributes activate suppression selectors", () => {
      const cartDrawerSource = fs.readFileSync(
        path.join(rootDir, "src/components/cart/CartDrawer.tsx"),
        "utf-8",
      );

      // CartDrawer must render cart-drawer, cart-drawer--open, role="dialog", aria-modal="true"
      expect(cartDrawerSource).toContain("cart-drawer");
      expect(cartDrawerSource).toContain("cart-drawer--open");
      expect(cartDrawerSource).toContain('role="dialog"');
      expect(cartDrawerSource).toContain('aria-modal="true"');
    });

    it("verifies WishlistDrawer component DOM attributes activate suppression selectors", () => {
      const wishlistDrawerSource = fs.readFileSync(
        path.join(rootDir, "src/components/wishlist/WishlistDrawer.tsx"),
        "utf-8",
      );

      // WishlistDrawer must render wl-drawer, role="dialog", aria-modal="true"
      expect(wishlistDrawerSource).toContain("wl-drawer");
      expect(wishlistDrawerSource).toContain('role="dialog"');
      expect(wishlistDrawerSource).toContain('aria-modal="true"');
    });
  });
});

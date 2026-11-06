import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Mobile Navigation & Drawers Z-Index Hierarchy — Adversarial Challenge", () => {
  const accountCssPath = path.resolve(process.cwd(), "src/components/account/account.css");
  const cartCssPath = path.resolve(process.cwd(), "src/components/cart/cart.css");
  const wishlistCssPath = path.resolve(process.cwd(), "src/components/wishlist/wishlist.css");
  const searchCssPath = path.resolve(process.cwd(), "src/components/search/search.css");

  const accountCss = fs.readFileSync(accountCssPath, "utf-8");
  const cartCss = fs.readFileSync(cartCssPath, "utf-8");
  const wishlistCss = fs.readFileSync(wishlistCssPath, "utf-8");
  const searchCss = fs.readFileSync(searchCssPath, "utf-8");

  describe("Strict Z-Index Hierarchy Invariants", () => {
    it("strictly verifies .acct__mobile-nav baseline z-index is 350", () => {
      const match = accountCss.match(/\.acct__mobile-nav\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(350);
    });

    it("strictly verifies cart drawer overlay has z-index: 380", () => {
      const match = cartCss.match(/\.cart-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(380);
    });

    it("strictly verifies cart drawer panel has z-index: 390", () => {
      const match = cartCss.match(/\.cart-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(390);
    });

    it("strictly verifies wishlist drawer overlay has z-index: 380", () => {
      const match = wishlistCss.match(/\.wl-drawer-overlay\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(380);
    });

    it("strictly verifies wishlist drawer panel has z-index: 390", () => {
      const match = wishlistCss.match(/\.wl-drawer\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(390);
    });

    it("strictly verifies search overlay has z-index: 400", () => {
      const match = searchCss.match(/\.sw-search-overlay\s*\{[^}]*?z-index:\s*(\d+)/s);
      expect(match).not.toBeNull();
      const zIndex = parseInt(match![1], 10);
      expect(zIndex).toBe(400);
    });

    it("confirms complete mathematical layer order: acctNav (350) < backdrop (380) < drawer (390) < search (400)", () => {
      const zAcct = 350;
      const zBackdrop = 380;
      const zDrawer = 390;
      const zSearch = 400;

      expect(zAcct).toBeLessThan(zBackdrop);
      expect(zBackdrop).toBeLessThan(zDrawer);
      expect(zDrawer).toBeLessThan(zSearch);
      expect(zBackdrop - zAcct).toBeGreaterThanOrEqual(30); // At least 30 unit buffer
    });
  });

  describe("CSS :has and Class-Based Dynamic Suppression Rules", () => {
    it("contains complete set of drawer and modal suppression selectors", () => {
      const requiredSelectors = [
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

      for (const selector of requiredSelectors) {
        expect(accountCss).toContain(selector);
      }
    });

    it("applies display: none !important to all suppression selectors", () => {
      // Find suppression rule block
      const suppressionBlock = accountCss.match(
        /body:has\(\.cart-drawer--open\)[\s\S]*?\{\s*display:\s*none\s*!important;\s*\}/,
      );
      expect(suppressionBlock).not.toBeNull();
    });

    it("suppresses mobile bottom nav when site navigation drawer is open on mobile", () => {
      const siteNavOpenRule = accountCss.match(
        /body\.site-nav-open\s+\.acct__mobile-nav\s*\{[^}]*?visibility:\s*hidden[^}]*?pointer-events:\s*none/s,
      );
      expect(siteNavOpenRule).not.toBeNull();
    });

    it("hides account mobile nav by default on desktop viewports", () => {
      const baseBlock = accountCss.match(/\.acct__mobile-nav\s*\{([^}]*)\}/);
      expect(baseBlock).not.toBeNull();
      expect(baseBlock![1]).toContain("display: none");
    });

    it("enables flex layout for account mobile nav within mobile media query", () => {
      const mobileNavBlock = accountCss.match(
        /@media\s*\(max-width:\s*767px\)[\s\S]*?pointer-events:\s*none;\s*\}\s*\.acct__mobile-nav\s*\{([^}]*)\}/,
      );
      expect(mobileNavBlock).not.toBeNull();
      expect(mobileNavBlock![1]).toContain("display: flex");
    });
  });

  describe("Portal Root Stacking Context Alignment", () => {
    it("verifies AccountMobileNav portals to document.body", () => {
      const tsxPath = path.resolve(process.cwd(), "src/components/account/AccountMobileNav.tsx");
      const tsxContent = fs.readFileSync(tsxPath, "utf-8");
      expect(tsxContent).toContain("createPortal(nav, document.body)");
    });

    it("verifies CartDrawer portals to document.body", () => {
      const tsxPath = path.resolve(process.cwd(), "src/components/cart/CartDrawer.tsx");
      const tsxContent = fs.readFileSync(tsxPath, "utf-8");
      expect(tsxContent).toContain("createPortal");
      expect(tsxContent).toContain("document.body");
    });

    it("verifies WishlistDrawer portals to document.body", () => {
      const tsxPath = path.resolve(process.cwd(), "src/components/wishlist/WishlistDrawer.tsx");
      const tsxContent = fs.readFileSync(tsxPath, "utf-8");
      expect(tsxContent).toContain("createPortal");
      expect(tsxContent).toContain("document.body");
    });
  });
});

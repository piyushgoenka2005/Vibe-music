import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Account mobile nav CSS rules & z-index contract", () => {
  const cssPath = path.resolve(process.cwd(), "src/components/account/account.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("sets baseline z-index to stay under drawer layers (< 380)", () => {
    // Find the z-index rule in .acct__mobile-nav block
    const match = cssContent.match(/\.acct__mobile-nav\s*\{[^}]*?z-index:\s*(\d+)/s);
    expect(match).not.toBeNull();
    const zIndex = parseInt(match![1], 10);
    expect(zIndex).toBeLessThan(380);
    expect(zIndex).toBe(350);
  });

  it("contains suppression rule for cart drawer and wishlist drawer", () => {
    expect(cssContent).toContain("body:has(.cart-drawer--open) .acct__mobile-nav");
    expect(cssContent).toContain("body.cart-open .acct__mobile-nav");
    expect(cssContent).toContain("body:has(.wl-drawer--open) .acct__mobile-nav");
    expect(cssContent).toContain("display: none !important");
  });
});

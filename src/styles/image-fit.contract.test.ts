import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

function readCss(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("product image fit contract", () => {
  it("PDP gallery photos use object-fit contain (no side crop)", () => {
    const css = readCss("src/components/product/product-detail.css");
    expect(css).toMatch(/\.pdp-gallery__photo\s*\{[^}]*object-fit:\s*contain/);
    expect(css).not.toMatch(/\.pdp-gallery__photo\s*\{[^}]*object-fit:\s*cover/);
  });

  it("PDP gallery CSS parses without unclosed blocks", () => {
    const css = readCss("src/components/product/product-detail.css");
    const opens = (css.match(/\{/g) ?? []).length;
    const closes = (css.match(/\}/g) ?? []).length;
    expect(opens).toBe(closes);
  });

  it("homepage product cards prefer contain over cover for product images", () => {
    const css = readCss("src/styles/premium-home.css");
    expect(css).toContain("object-fit: contain");
    expect(css).toMatch(/new-arrivals-card__image[\s\S]*object-fit:\s*contain/);
  });

  it("account avatars use cover (intentional circular crop)", () => {
    const css = readCss("src/components/account/account.css");
    expect(css).toMatch(/\.acct__hero-avatar-img[\s\S]*object-fit:\s*cover/);
  });
});

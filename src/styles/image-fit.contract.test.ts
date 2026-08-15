import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

function readCss(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function parseScaleToken(css: string, token: string): number | null {
  const match = css.match(new RegExp(`${token}:\\s*([\\d.]+)`));
  return match ? Number(match[1]) : null;
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

  it("shared tokens forbid resting product image scale above 1", () => {
    const css = readCss("src/styles/product-image-tokens.css");
    expect(parseScaleToken(css, "--product-image-scale-rest")).toBe(1);
    expect(parseScaleToken(css, "--pdp-gallery-photo-scale")).toBe(1);
    const hover = parseScaleToken(css, "--product-image-scale-hover");
    const hoverStrong = parseScaleToken(css, "--product-image-scale-hover-strong");
    expect(hover).not.toBeNull();
    expect(hoverStrong).not.toBeNull();
    expect(hover!).toBeLessThanOrEqual(1.08);
    expect(hoverStrong!).toBeLessThanOrEqual(1.08);
  });

  it("premium carousel does not reintroduce resting scale above 1", () => {
    const css = readCss("src/styles/premium-product-carousel.css");
    expect(css).not.toMatch(/--home-product-image-scale:\s*1\.[2-9]/);
    expect(css).toMatch(/product-suggest__item-photo-pop[\s\S]*scale\(var\(--product-image-scale-rest/);
  });

  it("PDP gallery transform fallbacks do not default above 1", () => {
    const css = readCss("src/components/product/product-detail.css");
    expect(css).not.toMatch(/pdp-gallery-photo-scale,\s*1\.(?:1[6-9]|2)/);
  });
});

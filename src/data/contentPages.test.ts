import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import { CANONICAL_BUSINESS_ADDRESS, DISPATCH_COPY } from "@/lib/brand/businessIdentity";
import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";
import { CONTENT_PAGES } from "@/data/contentPages";

describe("contentPages", () => {
  it("shipping page uses canonical Kolkata address and free-shipping policy", () => {
    const shipping = CONTENT_PAGES.shipping;
    const body = shipping.sections.flatMap((section) => section.paragraphs).join("\n");

    expect(body).toContain(CANONICAL_BUSINESS_ADDRESS);
    expect(body).toContain(DISPATCH_COPY);
    expect(body).not.toMatch(/Maharashtra warehouse/i);
    expect(body).toContain(SHIPPING_POLICY.shippingPage);
  });

  it("terms page includes registered business identity", () => {
    const terms = CONTENT_PAGES.terms;
    const body = terms.sections.flatMap((section) => section.paragraphs).join("\n");

    expect(body).toContain(BRAND.address);
    expect(terms.sections.some((section) => section.heading === "Registered business")).toBe(true);
  });

  it("returns page uses canonical support email", () => {
    const returns = CONTENT_PAGES.returns;
    const body = returns.sections.flatMap((section) => section.paragraphs).join("\n");

    expect(body).toContain(BRAND.email);
  });
});

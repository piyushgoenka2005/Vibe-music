import { describe, expect, it } from "vitest";
import { coerceSecureAssetUrl, sanitizeStorefrontImageUrl } from "./coerceSecureAssetUrl";

describe("coerceSecureAssetUrl", () => {
  it("upgrades public Vibe hosts to HTTPS", () => {
    expect(coerceSecureAssetUrl("http://cdn.vibemusic.in/products/a.webp")).toBe(
      "https://cdn.vibemusic.in/products/a.webp",
    );
  });

  it("rewrites local-network cdn-local URLs to the HTTPS page origin", () => {
    expect(
      coerceSecureAssetUrl("http://192.168.1.40:3000/cdn-local/products/x.webp", {
        pageOrigin: "https://dev.example.test",
      }),
    ).toBe("https://dev.example.test/cdn-local/products/x.webp");
  });

  it("leaves plain HTTP localhost URLs unchanged when no HTTPS origin is provided", () => {
    expect(coerceSecureAssetUrl("http://localhost:3000/cdn-local/a.webp")).toBe(
      "http://localhost:3000/cdn-local/a.webp",
    );
  });
});

describe("sanitizeStorefrontImageUrl", () => {
  it("keeps admin-chosen third-party images instead of hiding them", () => {
    expect(sanitizeStorefrontImageUrl("https://cdn.postimage.me/2026/09/10/3-2.webp")).toBe(
      "https://cdn.postimage.me/2026/09/10/3-2.webp",
    );
    expect(sanitizeStorefrontImageUrl("https://i.postimg.cc/abc/photo.webp")).toBe(
      "https://i.postimg.cc/abc/photo.webp",
    );
  });
});

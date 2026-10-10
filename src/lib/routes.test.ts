import { describe, expect, it } from "vitest";
import { resolveLegacyPath, resolveLinkHref } from "@/lib/routes";

describe("resolveLegacyPath", () => {
  it.each([
    ["/signin", "/login"],
    ["/sign-in", "/login"],
    ["/user/login", "/login"],
    ["/signup", "/register"],
    ["/sign-up/", "/register"],
    ["/dashboard", "/account"],
    ["/my-account", "/account"],
    ["/orders", "/account/orders"],
    ["/contact-us", "/contact"],
    ["/about-us", "/contact"],
    ["/shop", "/search"],
    ["/brand", "/brands"],
    ["/brand/boss", "/brands/boss"],
    ["/brand/boss/page/3", "/brands/boss"],
    ["/brand/roland/zoom/zoom/sound-x", "/brands/roland"],
    ["/product-category/keyboards-synth", "/search/results?q=keyboards%20synth"],
    ["/product-category/studio-and-recording/studio-mixers/", "/search/results?q=studio%20mixers"],
  ])("redirects %s -> %s", (from, to) => {
    expect(resolveLegacyPath(from)).toBe(to);
  });

  it("keeps existing shop prefix rules ahead of the bare /shop alias", () => {
    expect(resolveLegacyPath("/shop/guitars/electric")).toBe("/category/guitars");
  });

  it.each(["/", "/login", "/brands/boss", "/orders/abc/pay", "/account/orders", "/product/x"])(
    "leaves live route %s alone",
    (path) => {
      expect(resolveLegacyPath(path)).toBeNull();
    },
  );

  it("rewrites legacy hrefs while preserving the hash", () => {
    expect(resolveLinkHref("/brand/zoom#top")).toBe("/brands/zoom#top");
  });
});

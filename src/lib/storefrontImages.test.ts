import { describe, expect, it } from "vitest";
import {
  cdnDerivativeUrl,
  storefrontImageUrl,
} from "@/lib/storefrontImages";

const master =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png";
const der480 =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-w480.webp";

describe("storefrontImageUrl", () => {
  it("routes legacy CDN masters through the thumb API", () => {
    const result = storefrontImageUrl(master, 320);
    expect(result.kind).toBe("thumb");
    expect(result.src).toContain("/api/media/thumb?");
    expect(result.src).toContain(encodeURIComponent(master));
  });

  it("keeps / upgrades known CDN derivatives", () => {
    expect(cdnDerivativeUrl(der480, 300)).toBe(der480);
    const bumped = storefrontImageUrl(der480, 900);
    expect(bumped.kind).toBe("derivative");
    expect(bumped.src).toContain("-w960.webp");
  });

  it("leaves non-CDN urls alone", () => {
    const local = "/images/m/products/thumbs/x.webp";
    expect(storefrontImageUrl(local, 320)).toEqual({
      src: local,
      kind: "direct",
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  cdnDerivativeUrl,
  cdnMasterUrl,
  storefrontImageCandidates,
  storefrontImageUrl,
  storefrontZoomImageUrl,
} from "@/lib/storefrontImages";

const master =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png";
const der480 =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee-w480.webp";
const masterWebp =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";

describe("storefrontImageUrl", () => {
  it("routes legacy CDN masters through the thumb API", () => {
    const result = storefrontImageUrl(master, 480);
    expect(result.kind).toBe("thumb");
    expect(result.src).toContain("/api/media/thumb?");
    expect(result.src).toContain(encodeURIComponent(master));
  });

  it("keeps known CDN derivatives and thumbs from master when larger size is needed", () => {
    expect(cdnDerivativeUrl(der480, 300)).toBe(der480);
    expect(cdnMasterUrl(der480)).toBe(masterWebp);
    const bumped = storefrontImageUrl(der480, 900);
    expect(bumped.kind).toBe("thumb");
    expect(bumped.src).toContain("/api/media/thumb?");
    expect(bumped.src).toContain(encodeURIComponent(masterWebp));
    expect(bumped.src).toContain("w=960");
  });

  it("snaps thumb widths to shared buckets including zoom sizes", () => {
    const result = storefrontImageUrl(master, 310);
    expect(result.src).toContain("w=320");
    const card = storefrontImageUrl(master, 640);
    expect(card.src).toContain("w=800");
    const zoom = storefrontImageUrl(master, 1600);
    expect(zoom.src).toContain("w=1600");
  });

  it("uses CDN master for zoom panes", () => {
    expect(storefrontZoomImageUrl(der480)).toBe(masterWebp);
    expect(storefrontZoomImageUrl(master)).toBe(master);
  });

  it("unwraps already-thumbified URLs so CDN fallback survives", () => {
    const thumbified = storefrontImageUrl(master, 480).src;
    expect(thumbified).toContain("/api/media/thumb?");
    const candidates = storefrontImageCandidates(thumbified, 480);
    expect(candidates[0]).toContain("/api/media/thumb?");
    expect(candidates).toContain(master);
  });
});

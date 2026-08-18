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
  it("routes legacy CDN masters directly to avoid proxying when not webp", () => {
    const result = storefrontImageUrl(master, 480);
    expect(result.kind).toBe("direct");
    expect(result.src).toBe(master);
  });

  it("snaps thumb widths to shared buckets including zoom sizes for webp", () => {
    // Note: master is a .png, so it routes directly. Let's use a webp master to test snap widths.
    const webpMaster = "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const result = storefrontImageUrl(webpMaster, 310);
    expect(result.src).toContain("-w320.webp");

    const card = storefrontImageUrl(webpMaster, 640);
    expect(card.src).toContain("-w800.webp");
  });

  it("uses CDN master for zoom panes", () => {
    const thumb = storefrontImageUrl(master, 1200).src;
    const zoom = storefrontZoomImageUrl(thumb);
    expect(zoom).toBe(master);
  });

  it("keeps the original CDN image as the fallback", () => {
    const thumbified = storefrontImageUrl(master, 480).src;
    expect(thumbified).toBe(master);
    
    const candidates = storefrontImageCandidates(thumbified, 480);
    expect(candidates[0]).toBe(master);
    expect(candidates).toEqual(expect.arrayContaining([master]));
  });
});

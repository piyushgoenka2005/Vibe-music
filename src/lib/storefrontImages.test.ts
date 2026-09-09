import { describe, expect, it } from "vitest";
import {
  cdnSeoImageUrl,
  storefrontImageCandidates,
  storefrontImageUrl,
  storefrontZoomImageUrl,
} from "@/lib/storefrontImages";

const master =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png";

describe("storefrontImageUrl", () => {
  it("routes legacy PNG masters directly to static CDN derivatives", () => {
    const result = storefrontImageUrl(master, 480);
    expect(result.kind).toBe("derivative");
    expect(result.src).toContain("-w480.webp");
    expect(result.src).not.toContain("/api/media/thumb?url=");
  });

  it("snaps thumb widths to shared buckets including zoom sizes for webp", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const result = storefrontImageUrl(webpMaster, 310);
    expect(result.src).toContain("-w480.webp");

    const card = storefrontImageUrl(webpMaster, 640);
    expect(card.src).toContain("-w960.webp");
  });

  it("serves zoom panes via 1600w static CDN derivative, not runtime Sharp proxy", () => {
    const thumb = storefrontImageUrl(master, 1200).src;
    const zoom = storefrontZoomImageUrl(thumb);
    expect(zoom).toContain("-w1600.webp");
    expect(zoom).not.toContain("/api/media/thumb?url=");
  });

  it("keeps the original CDN image as the fallback candidate", () => {
    const candidates = storefrontImageCandidates(master, 480);
    expect(candidates[0]).toContain("-w480.webp");
    expect(candidates).toEqual(expect.arrayContaining([master]));
  });

  it("exposes absolute CDN URLs for SEO surfaces", () => {
    expect(cdnSeoImageUrl(storefrontImageUrl(master, 480).src)).toBe(
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp",
    );
    expect(cdnSeoImageUrl(master)).toBe(master);
    expect(cdnSeoImageUrl("")).toBe("");
  });
});

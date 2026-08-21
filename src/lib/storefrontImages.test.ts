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
  it("routes legacy PNG masters through the cached thumb proxy", () => {
    const result = storefrontImageUrl(master, 480);
    expect(result.kind).toBe("thumb");
    expect(result.src).toContain("/api/media/thumb?url=");
    expect(result.src).toContain(encodeURIComponent(master));
    expect(result.src).toContain("w=480");
  });

  it("snaps thumb widths to shared buckets including zoom sizes for webp", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const result = storefrontImageUrl(webpMaster, 310);
    expect(result.src).toContain("-w320.webp");

    const card = storefrontImageUrl(webpMaster, 640);
    expect(card.src).toContain("-w800.webp");
  });

  it("serves zoom panes through the proxy at the largest bucket, not the raw master", () => {
    const thumb = storefrontImageUrl(master, 1200).src;
    const zoom = storefrontZoomImageUrl(thumb);
    expect(zoom).toContain("/api/media/thumb?url=");
    expect(zoom).toContain("w=1600");
    expect(zoom).not.toBe(master);
  });

  it("keeps the original CDN image as the fallback candidate", () => {
    const candidates = storefrontImageCandidates(master, 480);
    expect(candidates[0]).toContain("/api/media/thumb?url=");
    expect(candidates).toEqual(expect.arrayContaining([master]));
  });

  it("exposes absolute CDN URLs for SEO surfaces", () => {
    expect(cdnSeoImageUrl(storefrontImageUrl(master, 480).src)).toBe(master);
    expect(cdnSeoImageUrl(master)).toBe(master);
    expect(cdnSeoImageUrl("")).toBe("");
  });
});

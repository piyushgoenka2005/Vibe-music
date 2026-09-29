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
    expect(result.src).toContain("w=480");
  });

  it("snaps thumb widths to shared buckets including zoom sizes for webp", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const result = storefrontImageUrl(webpMaster, 310);
    expect(result.src).toContain("-w480.webp");

    const card = storefrontImageUrl(webpMaster, 640);
    expect(card.src).toContain("-w960.webp");
  });

  it("serves zoom panes via thumb proxy for legacy PNG masters", () => {
    const zoom = storefrontZoomImageUrl(master);
    expect(zoom).toContain("/api/media/thumb?url=");
    expect(zoom).toContain("w=1600");
  });

  it("serves zoom panes via 1600w static CDN derivative for webp masters", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const zoom = storefrontZoomImageUrl(webpMaster);
    expect(zoom).toContain("-w1600.webp");
    expect(zoom).not.toContain("/api/media/thumb?url=");
  });

  it("keeps thumb + original fallbacks for legacy PNG masters", () => {
    const candidates = storefrontImageCandidates(master, 480);
    expect(candidates[0]).toContain("/api/media/thumb?url=");
    expect(candidates[1]).toBe(master);
  });

  it("steps down CDN derivative buckets when larger sizes are missing", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const candidates = storefrontImageCandidates(webpMaster, 1200);
    expect(candidates).toEqual([
      `${webpMaster.replace(".webp", "")}-w480.webp`,
      `${webpMaster.replace(".webp", "")}-w960.webp`,
      `${webpMaster.replace(".webp", "")}-w1600.webp`,
      webpMaster,
    ]);
  });

  it("exposes absolute CDN URLs for SEO surfaces", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    expect(cdnSeoImageUrl(storefrontImageUrl(webpMaster, 480).src)).toBe(webpMaster);
    expect(cdnSeoImageUrl(master)).toBe(master);
    expect(cdnSeoImageUrl("")).toBe("");
  });
});

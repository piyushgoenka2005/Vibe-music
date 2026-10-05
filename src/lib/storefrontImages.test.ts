import { describe, expect, it } from "vitest";
import {
  cdnSeoImageUrl,
  storefrontGalleryThumbCandidates,
  storefrontImageCandidates,
  storefrontImageUrl,
  storefrontZoomImageUrl,
} from "@/lib/storefrontImages";

const master =
  "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png";

describe("storefrontImageUrl", () => {
  it("prefers prebuilt CDN WebP derivatives for legacy PNG masters", () => {
    const result = storefrontImageUrl(master, 480);
    expect(result.kind).toBe("derivative");
    expect(result.src).toContain("-w480.webp");
    expect(result.src).not.toContain("/api/media/thumb?url=");
  });

  it("snaps thumb widths to shared buckets including zoom sizes for webp", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const result = storefrontImageUrl(webpMaster, 310);
    expect(result.src).toContain("-w320.webp");

    const card = storefrontImageUrl(webpMaster, 640);
    expect(card.src).toContain("-w960.webp");
  });

  it("serves zoom panes via 1600w CDN derivative for legacy PNG masters", () => {
    const zoom = storefrontZoomImageUrl(master);
    expect(zoom).toContain("-w1600.webp");
    expect(zoom).not.toContain("/api/media/thumb?url=");
  });

  it("serves zoom panes via 1600w static CDN derivative for webp masters", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const zoom = storefrontZoomImageUrl(webpMaster);
    expect(zoom).toContain("-w1600.webp");
    expect(zoom).not.toContain("/api/media/thumb?url=");
  });

  it("keeps CDN derivatives, thumb proxy, and original fallback for legacy PNG masters", () => {
    const candidates = storefrontImageCandidates(master, 480);
    expect(candidates[0]).toContain("-w480.webp");
    expect(candidates.some((url) => url === master)).toBe(true);
    expect(candidates.some((url) => url.includes("/api/media/thumb?url="))).toBe(true);
  });

  it("omits flaky 480px thumb proxies from PDP gallery rail candidates", () => {
    const candidates = storefrontGalleryThumbCandidates(master);
    expect(candidates.some((url) => url.includes("w=1600"))).toBe(true);
    expect(candidates.some((url) => url.includes("w=480"))).toBe(false);
  });

  it("places self-hosted fallbacks before the raw CDN master for legacy PNG", () => {
    const fallback = "/images/PA-Speaker.png";
    const candidates = storefrontImageCandidates(master, 480, [fallback]);
    expect(candidates.at(-1)).toBe(master);
    expect(candidates).toContain(fallback);
  });

  it("steps down CDN derivative buckets when larger sizes are missing", () => {
    const webpMaster =
      "https://cdn.vibemusic.in/products/guitars/abc/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp";
    const candidates = storefrontImageCandidates(webpMaster, 1200);
    expect(candidates).toEqual([
      `${webpMaster.replace(".webp", "")}-w1600.webp`,
      `${webpMaster.replace(".webp", "")}-w960.webp`,
      `${webpMaster.replace(".webp", "")}-w480.webp`,
      `${webpMaster.replace(".webp", "")}-w320.webp`,
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

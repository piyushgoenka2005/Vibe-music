import { describe, expect, it } from "vitest";
import {
  resolveProductCardImage,
  resolveProductGalleryUrls,
} from "@/lib/product/resolveProductCardImage";

describe("resolveProductCardImage", () => {
  it("uses category fallback when catalog image is on CDN", () => {
    const resolved = resolveProductCardImage({
      slug: "adeon-ad12-dsp-ad12-dsp",
      category: "Live Sound & Lighting",
      image: "https://cdn.vibemusic.in/products/live/example.png",
    });

    expect(resolved.src).toContain("cdn.vibemusic.in");
    expect(resolved.fallbackSrc.startsWith("/images/")).toBe(true);
    expect(resolved.fallbackSrc).not.toContain("cdn.vibemusic.in");
  });

  it("prefers self-hosted catalog image when present", () => {
    const resolved = resolveProductCardImage({
      slug: "adeon-ams84f-ams84f",
      category: "Live Sound & Lighting",
      image: "/images/m/products/image/052250cf73nOL3KRtEQEEmF9AByd84tPzCw64Ycd.jpg",
    });

    expect(resolved.src).toContain("/images/m/products/image/");
  });

  it("uses curated cymbal showcase art when catalog only has flat packshots", () => {
    const resolved = resolveProductCardImage({
      slug: "avus-avus-crystone-6-avus-crystone-6",
      category: "Drums & Percussion",
      image:
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-6-avus-crystone-6/8dbab992-6ab1-4b7b-ae61-4ad72ec93351.png",
      images: [
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-6-avus-crystone-6/8dbab992-6ab1-4b7b-ae61-4ad72ec93351.png",
      ],
    });

    expect(resolved.src).toContain("/promotions/");
    expect(resolved.src).toContain("DrumMonth-Superhero-Images-2");
    expect(resolved.fallbackSrc).toContain("8dbab992-6ab1-4b7b-ae61-4ad72ec93351.png");
  });

  it("keeps CDN flat packshot as fallback for each cymbal SKU", () => {
    const resolved = resolveProductCardImage({
      slug: "avus-avus-crystone-8-avus-crystone-8",
      category: "Drums & Percussion",
      image:
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
      images: [
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
      ],
    });

    expect(resolved.src).toContain("DrumMonth-Superhero-Images-2");
    expect(resolved.fallbackSrc).toContain("c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png");
  });

  it("uses curated showcase art for ORLIN 8 borrowed flat packshot", () => {
    const resolved = resolveProductCardImage({
      slug: "avus-orlin-8-orlin-8",
      category: "Drums & Percussion",
      image:
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
      images: [
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
      ],
    });

    expect(resolved.src).toContain("/images/");
    expect(resolved.src).toContain("DrumMonth-Superhero-Images-2");
    expect(resolved.fallbackSrc).toContain("c2c0dad6");
  });

  it("drops misassigned drum art from ORLIN 8 gallery", () => {
    const urls = resolveProductGalleryUrls({
      slug: "avus-orlin-8-orlin-8",
      category: "Drums & Percussion",
      image:
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
      images: [
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-8-avus-crystone-8/c2c0dad6-9522-4d44-b686-4ab6076b2d7d.png",
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-crystone-6-avus-crystone-6/e853f8d2-cfec-4a70-a7c8-ec3751205191.png",
      ],
    });

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/images/");
    expect(urls[1]).toContain("c2c0dad6");
    expect(urls.some((url) => url.includes("e853f8d2"))).toBe(false);
  });

  it("orders lifestyle cymbal art before flat packshots in PDP gallery", () => {
    const urls = resolveProductGalleryUrls({
      slug: "avus-zapcrash-12-zapcrash-12",
      category: "Drums & Percussion",
      image:
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-zapcrash-16-avus-zapcrash-16/413d7e18-9f0d-44cf-ba41-179e18fd5175.png",
      images: [
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-zapcrash-16-avus-zapcrash-16/413d7e18-9f0d-44cf-ba41-179e18fd5175.png",
        "https://cdn.vibemusic.in/products/drums-percussion/avus-avus-zapcrash-16-avus-zapcrash-16/1a47ce41-8c27-486a-b641-1166c3f7e66c.png",
      ],
    });

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("1a47ce41");
    expect(urls[1]).toContain("413d7e18");
  });
});

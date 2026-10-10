import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const uploadBufferToCdn = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/logger", () => ({ logWarn: vi.fn() }));
vi.mock("@/lib/server/platform/cdnStorage", () => ({
  uploadBufferToCdn: (...args: unknown[]) => uploadBufferToCdn(...args),
}));

const { isMirrorableExternalImageUrl, mirrorExternalImageToCdn, mirrorProductImageFields } =
  await import("./mirrorExternalImage");

const POSTER = "https://cdn.postimage.me/2026/09/10/3-2.webp";
const PRODUCT = "https://i.postimg.cc/3NcbbzCX/VM-AV-LIN-7A-NA.webp";
const CDN_COPY = "https://cdn.vibemusic.in/banners/homepage/copy.webp";

function imageResponse(contentType = "image/webp", status = 200): Response {
  return new Response(new Uint8Array([1, 2, 3]), {
    status,
    headers: { "content-type": contentType },
  });
}

describe("isMirrorableExternalImageUrl", () => {
  it("matches postimage / postimg hosts only by hostname", () => {
    expect(isMirrorableExternalImageUrl(POSTER)).toBe(true);
    expect(isMirrorableExternalImageUrl(PRODUCT)).toBe(true);
    expect(isMirrorableExternalImageUrl("https://evil.example/?u=postimg.cc")).toBe(false);
    expect(isMirrorableExternalImageUrl("https://postimg.cc.evil.example/a.webp")).toBe(false);
    expect(isMirrorableExternalImageUrl("https://cdn.vibemusic.in/banners/a.webp")).toBe(false);
    expect(isMirrorableExternalImageUrl("/images/guitar-1.webp")).toBe(false);
  });
});

describe("mirrorExternalImageToCdn", () => {
  beforeEach(() => {
    uploadBufferToCdn.mockReset().mockResolvedValue(CDN_COPY);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the image on the CDN and returns the CDN URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
    await expect(mirrorExternalImageToCdn(POSTER, "banners/homepage")).resolves.toBe(CDN_COPY);
    expect(uploadBufferToCdn).toHaveBeenCalledWith(expect.any(Buffer), "3-2.webp", {
      folder: "banners/homepage",
      contentType: "image/webp",
    });
  });

  it("keeps the original URL when the download fails or is not an image", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("image/webp", 404)));
    await expect(mirrorExternalImageToCdn(POSTER, "banners/homepage")).resolves.toBe(POSTER);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("text/html")));
    await expect(mirrorExternalImageToCdn(POSTER, "banners/homepage")).resolves.toBe(POSTER);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(mirrorExternalImageToCdn(POSTER, "banners/homepage")).resolves.toBe(POSTER);
    expect(uploadBufferToCdn).not.toHaveBeenCalled();
  });

  it("does not fetch URLs on other hosts", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const own = "https://cdn.vibemusic.in/banners/homepage/a.webp";
    await expect(mirrorExternalImageToCdn(own, "banners/homepage")).resolves.toBe(own);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("mirrorProductImageFields", () => {
  beforeEach(() => {
    uploadBufferToCdn.mockReset().mockResolvedValue(CDN_COPY);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => imageResponse()),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("swaps the primary image and gallery entries, copying each URL once", async () => {
    const own = "https://cdn.vibemusic.in/products/drums/x/a.webp";
    const result = await mirrorProductImageFields(
      { name: "Linage 7A", image: PRODUCT, images: [PRODUCT, own] },
      "products/drums/x",
    );
    expect(result).toEqual({ name: "Linage 7A", image: CDN_COPY, images: [CDN_COPY, own] });
    expect(uploadBufferToCdn).toHaveBeenCalledTimes(1);
  });

  it("leaves fields untouched when nothing is external", async () => {
    const input = { image: "/images/a.webp" };
    await expect(mirrorProductImageFields(input, "products/x/y")).resolves.toBe(input);
  });
});

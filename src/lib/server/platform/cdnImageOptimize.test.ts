import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

const storageRoot = await mkdtemp(path.join(os.tmpdir(), "vibe-cdn-"));
const logWarn = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/logger", () => ({ logWarn: (...args: unknown[]) => logWarn(...args) }));
vi.mock("@/lib/server/cdnStorage", () => ({
  getCdnStorageRoot: () => storageRoot,
  getCdnPublicBaseUrl: () => "https://cdn.vibemusic.in",
}));
vi.mock("sharp", () => {
  throw new Error(
    'Could not load the "sharp" module using the linux-x64 runtime\nUnsupported CPU: Prebuilt binaries for Linux x64 require v2 microarchitecture',
  );
});

const { uploadOptimizedImageToCdn } = await import("./cdnImageOptimize");

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]);

afterAll(async () => {
  await rm(storageRoot, { recursive: true, force: true });
});

describe("uploadOptimizedImageToCdn without a loadable sharp binary", () => {
  it("stores the original image instead of failing the upload", async () => {
    const result = await uploadOptimizedImageToCdn(JPEG, { folder: "products/drums/linage" });

    expect(result.url).toMatch(
      /^https:\/\/cdn\.vibemusic\.in\/products\/drums\/linage\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(result.masterUrl).toBe(result.url);
    expect(result.derivatives).toEqual({});

    const files = await readdir(path.join(storageRoot, "products/drums/linage"));
    expect(files).toHaveLength(1);
    expect(await readFile(path.join(storageRoot, "products/drums/linage", files[0]))).toEqual(JPEG);
    expect(logWarn).toHaveBeenCalledTimes(1);
  });

  it("only probes sharp once per process", async () => {
    await uploadOptimizedImageToCdn(JPEG, { folder: "banners/homepage" });
    expect(logWarn).toHaveBeenCalledTimes(1);
  });

  it("still rejects non-image payloads", async () => {
    await expect(
      uploadOptimizedImageToCdn(Buffer.from("not an image"), { folder: "banners/homepage" }),
    ).rejects.toThrow("Unsupported image type");
  });
});

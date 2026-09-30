import { describe, expect, it } from "vitest";
import {
  ADMIN_IMAGE_MAX_BYTES,
  readAndValidateImageFile,
  sniffImageType,
  validateImageUploadBuffer,
} from "@/lib/security/imageUploadValidation";

describe("imageUploadValidation", () => {
  it("detects JPEG magic bytes", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
    expect(sniffImageType(buffer)).toBe("image/jpeg");
  });

  it("rejects buffers that are too large", () => {
    const buffer = Buffer.alloc(ADMIN_IMAGE_MAX_BYTES + 1, 0xff);
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;

    const result = validateImageUploadBuffer(buffer, {
      declaredMime: "image/jpeg",
      maxBytes: ADMIN_IMAGE_MAX_BYTES,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/10MB/i);
    }
  });

  it("rejects declared MIME that does not match sniffed content", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
    const file = new File([jpeg], "fake.png", { type: "image/png" });
    const result = await readAndValidateImageFile(file, ADMIN_IMAGE_MAX_BYTES);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/declared image type/i);
    }
  });
});

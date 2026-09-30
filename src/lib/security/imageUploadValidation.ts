import "server-only";

export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ADMIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const ALLOWED_IMAGE_MIME_SET = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export function sniffImageType(buffer: Buffer): AllowedImageMime | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function isAllowedImageMime(value: string): value is AllowedImageMime {
  return ALLOWED_IMAGE_MIME_SET.has(value);
}

export function validateImageUploadBuffer(
  buffer: Buffer,
  options: {
    declaredMime?: string;
    maxBytes: number;
  },
): { ok: true; mime: AllowedImageMime } | { ok: false; error: string } {
  if (buffer.length <= 0) {
    return { ok: false, error: "Image file is empty" };
  }
  if (buffer.length > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024));
    return { ok: false, error: `Each image must be ${maxMb}MB or smaller` };
  }

  if (options.declaredMime && !isAllowedImageMime(options.declaredMime)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return {
      ok: false,
      error: "File content does not match a valid JPEG, PNG, or WebP image",
    };
  }

  if (options.declaredMime && options.declaredMime !== sniffed) {
    return {
      ok: false,
      error: "File content does not match the declared image type",
    };
  }

  return { ok: true, mime: sniffed };
}

export async function readAndValidateImageFile(
  file: File,
  maxBytes: number,
): Promise<{ ok: true; buffer: Buffer; mime: AllowedImageMime } | { ok: false; error: string }> {
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Each image must be ${maxMb}MB or smaller` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageUploadBuffer(buffer, {
    declaredMime: file.type,
    maxBytes,
  });

  if (!validated.ok) {
    return validated;
  }

  return { ok: true, buffer, mime: validated.mime };
}

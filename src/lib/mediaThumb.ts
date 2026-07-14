/** Minimum byte size for a real WebP thumbnail (placeholders are ~44B). */
export const THUMB_PLACEHOLDER_MAX_BYTES = 128;

/** Base64 tiny neutral WebP used only for rate-limit short-circuit responses. */
export const THUMB_PLACEHOLDER_WEBP_BASE64 =
  "UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=";

export function isThumbPlaceholderBody(body: Buffer | Uint8Array): boolean {
  return body.byteLength <= THUMB_PLACEHOLDER_MAX_BYTES;
}

export function thumbPlaceholderBuffer(): Buffer {
  return Buffer.from(THUMB_PLACEHOLDER_WEBP_BASE64, "base64");
}

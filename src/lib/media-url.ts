export interface MediaTransformOptions {
  width?: number;
  height?: number;
  quality?: number | "auto" | "auto:best" | "auto:good" | "auto:eco" | "auto:low";
  format?: "auto" | "webp" | "avif" | "jpg";
  crop?: "fill" | "fit" | "scale";
}

/** Apply Cloudinary-style transforms when the URL is hosted on Cloudinary; otherwise return as-is. */
export function buildMediaTransformUrl(
  url: string,
  options: MediaTransformOptions = {}
): string {
  if (!url.includes("res.cloudinary.com")) return url;

  const transforms = [
    "f_auto",
    `q_${options.quality ?? "auto"}`,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
    options.crop ? `c_${options.crop}` : options.width || options.height ? "c_fill" : null,
  ]
    .filter(Boolean)
    .join(",");

  return url.replace("/upload/", `/upload/${transforms}/`);
}

export const MEDIA_PRESETS = {
  productCard: { width: 640, height: 640, crop: "fit" as const, quality: "auto:best" as const },
  productDetail: { width: 1200, height: 1200, crop: "fit" as const, quality: "auto:best" as const },
  blogCover: { width: 1600, height: 840, crop: "fill" as const, quality: "auto:best" as const },
  banner: { width: 1920, height: 720, crop: "fill" as const, quality: "auto:best" as const },
  reviewThumbnail: { width: 240, height: 240, crop: "fill" as const, quality: "auto" as const },
  reviewGallery: { width: 900, height: 900, crop: "fit" as const, quality: "auto:best" as const },
};

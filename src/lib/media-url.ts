export interface MediaTransformOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
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
  productCard: { width: 320, height: 320, crop: "fill" as const, quality: "auto" as const },
  productDetail: { width: 900, height: 900, crop: "fit" as const, quality: "auto" as const },
  blogCover: { width: 1200, height: 630, crop: "fill" as const, quality: "auto" as const },
  banner: { width: 1600, height: 600, crop: "fill" as const, quality: "auto" as const },
  reviewThumbnail: { width: 120, height: 120, crop: "fill" as const, quality: "auto" as const },
  reviewGallery: { width: 600, height: 600, crop: "fit" as const, quality: "auto" as const },
};

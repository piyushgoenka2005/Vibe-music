import {
  buildCloudinaryTransformUrl,
  CLOUDINARY_PRESETS,
  type CloudinaryTransformOptions,
} from "@/lib/cloudinary-url";

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof CLOUDINARY_PRESETS = "productCard"
): string {
  if (!url) return url;
  return buildCloudinaryTransformUrl(url, CLOUDINARY_PRESETS[preset]);
}

export function optimizeImage(
  url: string,
  options: CloudinaryTransformOptions
): string {
  if (!url) return url;
  return buildCloudinaryTransformUrl(url, options);
}

import "server-only";

import { v2 as cloudinary } from "cloudinary";

export function getCloudinaryCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
}

export function assertCloudinaryConfig(): void {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  }
  if (!process.env.CLOUDINARY_API_KEY) missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary env vars: ${missing.join(", ")}`);
  }
}

export function configureCloudinary(): typeof cloudinary {
  assertCloudinaryConfig();
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export interface CloudinaryUploadOptions {
  folder: string;
  publicId?: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  options: CloudinaryUploadOptions
): Promise<string> {
  const client = configureCloudinary();
  const baseName = filename.replace(/\.[^.]+$/, "");

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId ?? baseName,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

function safeParsePublicId(url: string): string | null {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName || !url.includes("res.cloudinary.com")) return null;
  if (!url.includes(`res.cloudinary.com/${cloudName}`)) return null;

  const match = url.match(/\/upload\/(?:v\d+\/)?([^.?]+)/);
  if (!match?.[1]) return null;

  const publicId = match[1];
  if (
    !publicId.startsWith("products/") &&
    !publicId.startsWith("banners/") &&
    !publicId.startsWith("blog/") &&
    !publicId.startsWith("reviews/")
  ) {
    return null;
  }

  return publicId;
}

export async function deleteImageFromCloudinary(url: string): Promise<boolean> {
  const publicId = safeParsePublicId(url);
  if (!publicId) return false;

  const client = configureCloudinary();
  const result = await client.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  return result.result === "ok" || result.result === "not found";
}

export function getSignedUploadParams(folder: string) {
  const client = configureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = client.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
  };
}

export function categoryUploadFolder(categorySlug: string): string {
  const safe = categorySlug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `products/${safe || "general"}`;
}

export function bannerUploadFolder(): string {
  return "banners/homepage";
}

export function blogUploadFolder(): string {
  return "blog/covers";
}

export function reviewUploadFolder(productId: string): string {
  const safe = productId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `reviews/${safe || "general"}`;
}

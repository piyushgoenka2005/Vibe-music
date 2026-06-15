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

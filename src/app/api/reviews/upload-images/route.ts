import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
} from "@/lib/api/route-utils";
import { reviewUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import { MAX_REVIEW_IMAGES } from "@/lib/validations/review";
import { getProductDetailBySlug } from "@/services/catalogService";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sniffImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
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

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "review-upload", {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const csrf = enforceMutationSecurity(request);
    if (csrf) return csrf;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const formData = await request.formData();
    const productSlug = String(formData.get("productSlug") ?? "").trim();
    if (!productSlug) {
      return jsonError("productSlug is required", 400);
    }

    const product = await getProductDetailBySlug(productSlug);
    if (!product) {
      return jsonError("Product not found", 404);
    }

    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return jsonError("No images provided", 400);
    }
    if (files.length > MAX_REVIEW_IMAGES) {
      return jsonError(`Maximum ${MAX_REVIEW_IMAGES} images allowed`, 400);
    }

    const folder = reviewUploadFolder(product.id);
    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return jsonError("Only JPEG, PNG, and WebP images are allowed", 400);
      }
      if (file.size > MAX_BYTES) {
        return jsonError("Each image must be 5MB or smaller", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const sniffed = sniffImageType(buffer);
      if (!sniffed || !ALLOWED_TYPES.has(sniffed)) {
        return jsonError("File content does not match a valid JPEG, PNG, or WebP image", 400);
      }

      const uploaded = await uploadOptimizedImageToCdn(buffer, {
        folder,
        filenameHint: file.name,
      });
      urls.push(uploaded.url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    return handleRouteError(error, "POST /api/reviews/upload-images");
  }
}

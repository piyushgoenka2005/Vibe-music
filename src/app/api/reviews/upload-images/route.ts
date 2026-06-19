import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
} from "@/lib/api/route-utils";
import { reviewUploadFolder, uploadBufferToCloudinary } from "@/lib/cloudinary";
import { getProductDetailBySlug } from "@/services/catalogService";

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return jsonError("No images provided", 400);
    }
    if (files.length > MAX_FILES) {
      return jsonError(`Maximum ${MAX_FILES} images allowed`, 400);
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
      const url = await uploadBufferToCloudinary(buffer, file.name, { folder });
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    return handleRouteError(error, "POST /api/reviews/upload-images");
  }
}

import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  productUploadFolder,
  uploadBufferToCdn,
} from "@/lib/server/cdnStorage";

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const formData = await request.formData();
    const categorySlug = String(formData.get("categorySlug") ?? "general");
    // Optional — current admin form sends only categorySlug; falls back to "general".
    const productSlug = String(formData.get("productSlug") ?? "").trim();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const folder = productUploadFolder(categorySlug, productSlug || undefined);
    const urls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadBufferToCdn(buffer, file.name, {
        folder,
        contentType: file.type,
      });
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

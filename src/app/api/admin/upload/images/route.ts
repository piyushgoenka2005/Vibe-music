import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  categoryUploadFolder,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const formData = await request.formData();
    const categorySlug = String(formData.get("categorySlug") ?? "general");
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const folder = categoryUploadFolder(categorySlug);
    const urls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadBufferToCloudinary(buffer, file.name, { folder });
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

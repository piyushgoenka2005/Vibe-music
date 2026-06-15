import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  blogUploadFolder,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    await requireAdmin("blog:write");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadBufferToCloudinary(buffer, file.name, {
      folder: blogUploadFolder(),
    });

    return NextResponse.json({ url });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

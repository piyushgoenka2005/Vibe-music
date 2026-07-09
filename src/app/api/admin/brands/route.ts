import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listBrands, createBrand } from "@/lib/server/brandRepository";
import { adminBrandSchema } from "@/lib/validations/wrFeatures";

export async function GET() {
  try {
    await requireAdmin("categories:read");
    const brands = await listBrands();
    return NextResponse.json({ brands });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("categories:write", request);
    const body = await request.json();
    const parsed = adminBrandSchema.parse(body);
    const brand = await createBrand(parsed);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

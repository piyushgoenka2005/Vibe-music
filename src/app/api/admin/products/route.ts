import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listAdminProducts,
  createAdminProduct,
  bulkUpdateProductStatus,
} from "@/lib/server/adminProductService";
import { adminProductSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("products:read");
    const { searchParams } = new URL(request.url);
    const result = await listAdminProducts({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      offset: searchParams.has("offset")
        ? Number(searchParams.get("offset") ?? 0)
        : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const body = await request.json();

    if (body.action === "bulk_status") {
      const ids = body.ids as string[];
      const status = body.status as "active" | "draft" | "archived";
      const count = await bulkUpdateProductStatus(ids, status);
      return NextResponse.json({ updated: count });
    }

    const parsed = adminProductSchema.parse(body);
    const product = await createAdminProduct({
      ...parsed,
      availability: parsed.availability ?? "in-stock",
      condition: parsed.condition ?? "new",
      brandSlug: parsed.brandSlug ?? parsed.slug,
      categorySlug: parsed.categorySlug ?? parsed.slug,
      rating: parsed.rating ?? 0,
      reviewCount: parsed.reviewCount ?? 0,
      imageColor: parsed.imageColor ?? "#e8e8e8",
      image: parsed.image ?? "",
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

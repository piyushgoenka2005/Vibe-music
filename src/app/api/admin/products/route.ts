import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { vibemusicBulkExportFilename } from "@/lib/admin/bulkImportTemplate";
import {
  listAdminProducts,
  createAdminProduct,
  bulkUpdateProductStatus,
  buildAdminProductsExportCsv,
} from "@/lib/server/adminProductService";
import { adminProductSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("products:read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const stockRaw = searchParams.get("stock");
    const stock =
      stockRaw === "in" || stockRaw === "low" || stockRaw === "out" ? stockRaw : undefined;

    if (searchParams.get("export") === "csv") {
      const csv = await buildAdminProductsExportCsv({
        search,
        status,
        category,
      });
      const filename = vibemusicBulkExportFilename("csv");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const result = await listAdminProducts({
      search,
      status,
      category,
      stock,
      limit: Number(searchParams.get("limit") ?? 20),
      offset: searchParams.has("offset") ? Number(searchParams.get("offset") ?? 0) : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
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

import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  bulkDeleteAdminProducts,
  bulkUpdateAdminCategory,
  bulkUpdateAdminStock,
  bulkUpdateProductStatus,
} from "@/lib/server/adminProductService";

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write");
    const body = await request.json();
    const action = body.action as string;
    const ids = body.ids as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    switch (action) {
      case "delete": {
        await requireAdmin("products:delete");
        const deleted = await bulkDeleteAdminProducts(ids);
        return NextResponse.json({ deleted });
      }
      case "archive": {
        const updated = await bulkUpdateProductStatus(ids, "archived");
        return NextResponse.json({ updated });
      }
      case "activate": {
        const updated = await bulkUpdateProductStatus(ids, "active");
        return NextResponse.json({ updated });
      }
      case "update_stock": {
        const stock = Number(body.stock);
        if (!Number.isFinite(stock) || stock < 0) {
          return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
        }
        const updated = await bulkUpdateAdminStock(
          ids.map((id) => ({ id, stockQuantity: stock }))
        );
        return NextResponse.json({ updated });
      }
      case "update_category": {
        const category = String(body.category ?? "");
        const categorySlug = String(body.categorySlug ?? "");
        if (!category || !categorySlug) {
          return NextResponse.json({ error: "Category is required" }, { status: 400 });
        }
        const updated = await bulkUpdateAdminCategory(
          ids.map((id) => ({ id, category, categorySlug }))
        );
        return NextResponse.json({ updated });
      }
      default:
        return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}

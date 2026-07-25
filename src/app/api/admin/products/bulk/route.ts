import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  bulkDeleteAdminProducts,
  bulkUpdateAdminCategory,
  bulkUpdateAdminStock,
  bulkUpdateProductStatus,
} from "@/lib/server/adminProductService";
import { adminProductBulkSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);
    const parsed = adminProductBulkSchema.parse(await request.json());

    switch (parsed.action) {
      case "delete": {
        await requireAdmin("products:delete", request);
        const deleted = await bulkDeleteAdminProducts(parsed.ids);
        return NextResponse.json({ deleted });
      }
      case "archive": {
        const updated = await bulkUpdateProductStatus(parsed.ids, "archived");
        return NextResponse.json({ updated });
      }
      case "activate": {
        const updated = await bulkUpdateProductStatus(parsed.ids, "active");
        return NextResponse.json({ updated });
      }
      case "update_stock": {
        const updated = await bulkUpdateAdminStock(
          parsed.ids.map((id) => ({ id, stockQuantity: parsed.stock }))
        );
        return NextResponse.json({ updated });
      }
      case "update_category": {
        const updated = await bulkUpdateAdminCategory(
          parsed.ids.map((id) => ({
            id,
            category: parsed.category,
            categorySlug: parsed.categorySlug,
          }))
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

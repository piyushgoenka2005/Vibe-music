import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listInventory,
  adjustStock,
  listAdjustments,
  computeInventoryStats,
} from "@/lib/server/inventoryService";
import { adminInventoryAdjustSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("inventory:read");
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "adjustments") {
      const adjustments = await listAdjustments();
      return NextResponse.json({ adjustments });
    }

    if (searchParams.get("export") === "csv") {
      const inventory = await listInventory();
      const header = "productId,productName,sku,stockQuantity,availableQuantity,lowStockThreshold\n";
      const rows = inventory
        .map(
          (item) =>
            `${item.productId},${item.productName},${item.sku ?? ""},${item.stockQuantity},${item.availableQuantity ?? item.stockQuantity},${item.lowStockThreshold}`
        )
        .join("\n");
      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="inventory.csv"',
        },
      });
    }

    // One catalog read feeds both the table and the stat tiles.
    const inventory = await listInventory();
    const stats = computeInventoryStats(inventory);
    return NextResponse.json({ inventory, stats });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("inventory:write", request);
    const body = await request.json();
    const parsed = adminInventoryAdjustSchema.parse(body);
    const adjustment = await adjustStock(
      parsed.productId,
      parsed.newQuantity,
      parsed.reason,
      admin.email
    );
    return NextResponse.json({ adjustment });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
